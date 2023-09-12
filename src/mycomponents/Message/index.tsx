import ReactDOM from 'react-dom'
import { getDefaultContainer } from '../config'
import { isFunc } from '../utils/is'
import Container from './Container'
import { destroy, getComponent } from './messager'
import { MessageType, MessageOptions, PositionType, MessageFuncArg } from './Props'
import { messageClass } from './styles'

let defaultOptions: MessageOptions & {
  duration?: number
  top?: string
} = {}

const create = (type: MessageType) => (
  content: MessageFuncArg['content'],
  duration?: MessageFuncArg['duration'],
  options?: MessageOptions
) => {
  const mo = Object.assign({}, defaultOptions, options)
  duration = [duration, defaultOptions.duration, 3].find(d => typeof d === 'number')!
  const { onClose, position = 'top', title, className = '', top = 'auto', hideClose, container } = mo
  // return getComponent({ position, container }).then(messager =>
  //   messager.addMessage({
  //     content,
  //     duration,
  //     type,
  //     onClose,
  //     title,
  //     className,
  //     top,
  //     position,
  //     hideClose,
  //   })
  // )
  const el = getElement(position, container);
  ReactDOM.render(
    <Container msg={{
      content,
      duration,
      type,
      onClose,
      title,
      className,
      top,
      position,
      hideClose,
    }} onDestory={() => {
      ReactDOM.unmountComponentAtNode(el)
      if (el && el.parentNode) el.parentNode.removeChild(el)
    }} />,
    el
  )
  // return <Container msg = {{
  //   content,
  //     duration,
  //     type,
  //     onClose,
  //     title,
  //     className,
  //     top,
  //     position,
  //     hideClose,
  // }} onDestory={destroy.bind(null, position)}/>
  // console.log(el.current)
  // el.current.addMessage({
  //   content,
  //     duration,
  //     type,
  //     onClose,
  //     title,
  //     className,
  //     top,
  //     position,
  //     hideClose,
  // })
}

function getElement(type: PositionType, container?: (() => HTMLElement) | HTMLElement) {
  const defaultContainer = getDefaultContainer();
  const div = document.createElement('div');
  div.className = messageClass('_', type);
  let target = defaultContainer;

  if (container && isFunc(container)) {
    target = container();
  }

  if (container && container instanceof HTMLElement) {
    target = container;
  }

  target.appendChild(div);
  return div;
};

export default {
  show: create('default'),
  success: create('success'),
  info: create('info'),
  warn: create('warning'),
  warning: create('warning'),
  danger: create('danger'),
  error: create('danger'),
  close: (key?: PositionType) => {
    if (key) destroy(key)
    else {
      ; (['top', 'middle', 'top-left', 'top-right', 'bottom-left', 'bottom-right'] as PositionType[]).forEach(k => {
        destroy(k)
      })
    }
  },
  setOptions: (options: MessageOptions) => {
    defaultOptions = options
  },
}