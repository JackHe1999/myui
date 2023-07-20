import classGenerate from '../utils/classname'

export const headerClass = classGenerate(require('./header.less'), 'header')
export const mainClass = classGenerate(require('./index.less'), 'main')
export const homeClass = classGenerate(require('./home.less'), 'home')