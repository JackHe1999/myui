import classGenerate from '../utils/classname'

export const headerClass = classGenerate(require('./header.less'), 'header')
export const mainClass = classGenerate(require('./index.less'), 'main')
export const homeClass = classGenerate(require('./home.less'), 'home')
export const markdownClass = classGenerate(require('./markdown.less'), 'markdown')
export const exampleClass = classGenerate(require('./example.less'), 'example')
export const navClass = classGenerate(require('./nav.less'), 'nav')
