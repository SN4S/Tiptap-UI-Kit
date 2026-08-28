import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
// KaTeX styles: Library no longer includes styles built-in, import manually when using math formulas
import 'katex/dist/katex.min.css'
import App from './App.vue'

const app = createApp(App)
app.use(Antd)
app.mount('#app')
