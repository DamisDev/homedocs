import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import RegisterView from './RegisterView.vue'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div/>' } },
      { path: '/', name: 'dashboard', component: { template: '<div/>' } },
    ],
  })
}

describe('RegisterView — toggle crea famiglia / entra con codice', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mostra "Nome della famiglia" e non "Codice invito" in modalità default (crea)', async () => {
    const router = makeRouter()
    const wrapper = mount(RegisterView, { global: { plugins: [router] } })

    expect(wrapper.text()).toContain('Nome della famiglia')
    expect(wrapper.text()).not.toContain('Codice invito')
  })

  it('passa a "Codice invito" e nasconde "Nome della famiglia" cliccando "Entra con codice"', async () => {
    const router = makeRouter()
    const wrapper = mount(RegisterView, { global: { plugins: [router] } })

    const [, entraButton] = wrapper.findAll('button[type="button"]')
    await entraButton.trigger('click')

    expect(wrapper.text()).toContain('Codice invito')
    expect(wrapper.text()).not.toContain('Nome della famiglia')
  })

  it('torna a "Nome della famiglia" ricliccando "Crea una famiglia"', async () => {
    const router = makeRouter()
    const wrapper = mount(RegisterView, { global: { plugins: [router] } })

    const [creaButton, entraButton] = wrapper.findAll('button[type="button"]')
    await entraButton.trigger('click')
    await creaButton.trigger('click')

    expect(wrapper.text()).toContain('Nome della famiglia')
    expect(wrapper.text()).not.toContain('Codice invito')
  })
})
