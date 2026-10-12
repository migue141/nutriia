"""Prueba opcional de la interfaz sin servidor, con Chromium y Playwright Python.

Para ejecutar: python tests/browser-smoke.py
Se carga la interfaz en un documento aislado y se simula localStorage; no
verifica despliegue ni Service Worker en una URL real.
"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = '\n'.join(re.sub(r'^import .*?;\s*$', '', (ROOT/'js'/name).read_text(), flags=re.M).replace('export ', '') for name in ['core.mjs', 'seed.mjs', 'store.mjs', 'app.mjs'])
HTML = f'<html><head><style>{(ROOT/"assets/styles.css").read_text()}</style></head><body><div id="app"></div></body></html>'

def setup(page, saved=None):
    page.set_content(HTML)
    page.evaluate('''(initial) => { const map=new Map(initial?Object.entries(initial):[]);
      Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}});
    }''', saved or {})
    page.add_script_tag(content=SCRIPT)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    ctx = browser.new_context(viewport={'width':1280,'height':850}, accept_downloads=True)
    page = ctx.new_page()
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    setup(page)
    assert page.get_by_text('Hola 👋').count()==1
    # Crear alimento con valor desconocido diferente de cero.
    page.locator('.desktop-nav [data-page="alimentos"]').click()
    assert page.locator('.food-card').count()>=10
    page.locator('[data-action="food-open"]').first.click()
    page.locator('#f-name').fill('Tofu de prueba')
    page.locator('#nut-kcal').fill('120')
    page.locator('#nut-protein').fill('15')
    page.locator('#nut-sugar').fill('0')
    page.locator('#food-form button[type="submit"]').click()
    tofu=page.locator('.food-card').filter(has_text='Tofu de prueba')
    assert tofu.count()==1
    tofu.locator('[data-action="food-fav"]').click()
    page.locator('#food-filter').select_option('favoritos')
    assert page.locator('.food-card').count()==1
    page.locator('#food-filter').select_option('todos')
    # Diario, cantidad y corrección de totales.
    page.locator('.food-card').filter(has_text='Tofu de prueba').locator('[data-action="entry-open"]').click()
    page.locator('#entry-quantity').fill('150')
    page.locator('#entry-form button[type="submit"]').click()
    page.locator('.desktop-nav [data-page="diario"]').click()
    assert '180 kcal' in page.locator('body').inner_text()
    page.locator('.meal-card').first.locator('[data-action="entry-open"][data-id]').click()
    page.locator('#entry-quantity').fill('200')
    page.locator('#entry-form button[type="submit"]').click()
    assert '240 kcal' in page.locator('body').inner_text()
    # Guardar y reutilizar la comida, sin perder la plantilla.
    page.locator('.meal-card').first.locator('[data-action="meal-save"]').click()
    page.locator('#meal-save-name').fill('Mi comida de prueba')
    page.locator('#meal-save-form button[type="submit"]').click()
    assert page.get_by_text('Mi comida de prueba').count()>=1
    page.locator('.meal-card').nth(3).locator('[data-action="saved-apply-open"]').click()
    page.locator('#saved-apply-form button[type="submit"]').click()
    assert page.locator('.meal-card').nth(3).get_by_text('Tofu de prueba').count()==1
    # Fecha pasada y regreso.
    page.locator('[data-action="shift-date"][data-offset="-1"]').first.click()
    assert page.get_by_text('Tofu de prueba').count()==0
    page.locator('[data-action="shift-date"][data-offset="1"]').first.click()
    assert page.get_by_text('Tofu de prueba').count()>=1
    # Crear receta y añadir una ración sin sumar ingredientes por duplicado.
    page.locator('.desktop-nav [data-page="recetas"]').click()
    page.locator('[data-action="recipe-edit"]').first.click()
    page.locator('#r-title').fill('Avena sencilla de prueba')
    page.locator('#r-food').select_option('avena')
    page.locator('#r-quantity').fill('40')
    page.locator('[data-action="recipe-ingredient-add"]').click()
    page.locator('#r-steps').fill('Mezclar con agua y servir.')
    page.locator('#recipe-form button[type="submit"]').click()
    article=page.locator('.recipe-card').filter(has_text='Avena sencilla de prueba')
    assert article.count()==1
    article.locator('[data-action="recipe-fav"]').click()
    article.locator('[data-action="recipe-open"]').click()
    page.locator('#recipe-diary-meal').select_option('merienda')
    page.locator('[data-action="recipe-to-diary"]').click()
    page.locator('.desktop-nav [data-page="diario"]').click()
    assert page.locator('.meal-card').nth(2).get_by_text('Avena sencilla de prueba').count()==1
    # Peso, pasos y entrenamiento.
    page.locator('.desktop-nav [data-page="actividad"]').click()
    page.locator('#steps-value').fill('7520')
    page.locator('#steps-form button[type="submit"]').click()
    assert '7520 pasos' in page.locator('body').inner_text()
    page.locator('#weight-value').fill('78.5')
    page.locator('#weight-form button[type="submit"]').click()
    assert '78,5 kg' in page.locator('body').inner_text()
    page.locator('#workout-type').fill('Entrenamiento de fuerza')
    page.locator('#workout-minutes').fill('60')
    page.locator('#workout-form button[type="submit"]').click()
    assert page.get_by_text('Entrenamiento de fuerza').count()>=1
    # Perfil y estimación adulta.
    page.locator('.desktop-nav [data-page="perfil"]').click()
    page.locator('#age').fill('35')
    page.locator('#height').fill('180')
    page.locator('#weight').fill('78.5')
    page.locator('#sex').select_option('male')
    page.locator('#profile-form button[type="submit"]').click()
    assert 'Mantenimiento' in page.locator('body').inner_text()
    # Persistencia: reinicio aislado con el mismo almacén simulado.
    saved=page.evaluate('''() => ({'nutriia-local-v2':localStorage.getItem('nutriia-local-v2')})''')
    second=ctx.new_page()
    second.on('pageerror', lambda e: errors.append(str(e)))
    setup(second,saved)
    second.locator('.desktop-nav [data-page="diario"]').click()
    assert second.get_by_text('Tofu de prueba').count()>=1
    second.locator('.desktop-nav [data-page="actividad"]').click()
    assert '7520 pasos' in second.locator('body').inner_text()
    # Un segundo almacenamiento independiente NO hereda los registros locales.
    independent=ctx.new_page()
    setup(independent)
    independent.locator('.desktop-nav [data-page="alimentos"]').click()
    assert independent.get_by_text('Tofu de prueba').count()==0
    # Buscar y analizar cantidades por texto en el catálogo disponible.
    independent.locator('#analysis-text').fill('150 g arroz blanco cocido; 100 g pechuga de pollo cocida')
    independent.locator('#analysis-form button[type="submit"]').click()
    assert independent.locator('[data-action="analysis-add"]').count()==2
    # Edición, borrado y conservación de diarios previos.
    extra=ctx.new_page()
    extra.on('dialog',lambda d:d.accept())
    setup(extra,saved)
    extra.locator('.desktop-nav [data-page="alimentos"]').click()
    extra.locator('.food-card').filter(has_text='Tofu de prueba').locator('[data-action="food-open"]').click()
    extra.locator('#nut-kcal').fill('130')
    extra.locator('#food-form button[type="submit"]').click()
    assert '130 kcal' in extra.locator('.food-card').filter(has_text='Tofu de prueba').inner_text()
    extra.locator('.food-card').filter(has_text='Tofu de prueba').locator('[data-action="food-open"]').click()
    extra.locator('[data-action="food-delete"]').click()
    assert extra.locator('.food-card').filter(has_text='Tofu de prueba').count()==0
    extra.locator('.desktop-nav [data-page="diario"]').click()
    assert extra.get_by_text('Tofu de prueba').count()>=1 # Instantánea histórica conservada
    extra.locator('.meal-card').first.locator('[data-action="entry-delete"]').click()
    assert extra.locator('.meal-card').first.get_by_text('Tofu de prueba').count()==0
    assert extra.locator('.meal-card').nth(3).get_by_text('Tofu de prueba').count()==1
    # Edición y borrado de comida guardada.
    extra.locator('[data-action="saved-editor"]').click()
    extra.locator('#saved-name').fill('Mi plantilla actualizada')
    extra.locator('#saved-name-form button[type="submit"]').click()
    extra.locator('[data-action="modal-close"]').click()
    assert extra.get_by_text('Mi plantilla actualizada').count()>=1
    extra.locator('[data-action="saved-delete"]').click()
    assert extra.get_by_text('Mi plantilla actualizada').count()==0
    # Borrado de receta propia, conservando diario anterior.
    extra.locator('.desktop-nav [data-page="recetas"]').click()
    extra.locator('.recipe-card').filter(has_text='Avena sencilla de prueba').locator('[data-action="recipe-edit"]').click()
    extra.locator('[data-action="recipe-delete"]').click()
    assert extra.locator('.recipe-card').filter(has_text='Avena sencilla de prueba').count()==0
    extra.locator('.desktop-nav [data-page="diario"]').click()
    assert extra.get_by_text('Avena sencilla de prueba').count()>=1
    # Exportación de copia JSON desde navegador.
    extra.locator('.desktop-nav [data-page="datos"]').click()
    with extra.expect_download() as download:
        extra.locator('[data-action="export"]').click()
    assert download.value.suggested_filename.endswith('.json')
    # Tablet horizontal sin desbordamiento.
    tablet=ctx.new_page()
    tablet.set_viewport_size({'width':820,'height':1180})
    setup(tablet,saved)
    assert tablet.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    # Probar pantalla móvil sin desplazamiento horizontal.
    mobile=ctx.new_page()
    mobile.set_viewport_size({'width':390,'height':844})
    mobile.on('pageerror', lambda e: errors.append(str(e)))
    setup(mobile,saved)
    assert mobile.locator('.bottom-nav').is_visible()
    assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    mobile.screenshot(path=str(ROOT/'assets'/'preview-movil.png'),full_page=True)
    assert not errors,errors
    print('OK: interfaz Chromium, alimentos, cálculos, favoritos, diario, recetas, fecha, actividad, persistencia simulada y pantalla móvil.')
    browser.close()
