import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'
import { getPosition } from '../utils/dom/popover'
import { isFunc } from '../utils/is'
import { getParent } from '../utils/dom/element'
import { popoverClass } from './styles'
import { docSize } from '../utils/dom/document'
import isDOMElement from '../utils/dom/isDOMElement'
import { Provider as AbsoluteProvider } from '../Table/context'
import { consumer, Provider } from './context'
import { getUidStr } from '../utils/uid'
import { isInDocument } from '../utils/dom/isInDocument'
import getCommonContainer from '../utils/dom/popContainer'
import { Provider as ScrollProvider } from '../Scroll/context'
import { PanelProps, PopoverPositionType } from './Props'

const emptyEvent = <U extends { stopPropagation: () => void }>(e: U) => e.stopPropagation()

const DefaultProps: any = {
  background: '',
  trigger: 'hover',
  mouseEnterDelay: 0,
  mouseLeaveDelay: 0,
  priorityDirection: 'vertical',
  showArrow: true,
}

const Panel = React.memo((props: PanelProps) => {
  let delayTimeout: NodeJS.Timeout;
  let element: HTMLDivElement = document.createElement('div');
  let container: HTMLElement;
  let chain: string[] = [];
  let isRendered: boolean = false;

  const [isShow, setIsShow] = useState<boolean>(props.defaultVisible || false);
  const placeholderRef = useRef<any>(null);
  let parentElement: HTMLElement = placeholderRef.current.parentElement!;
  const [id, setId] = useState<string>(`popover_${getUidStr()}`);
  const [forceUpdateFlag, setForceUpdateFlag] = useState<boolean>(false);

  const setShow = (show: boolean) => {
    const { onVisibleChange, mouseEnterDelay = 0, mouseLeaveDelay = 0, trigger = 'hover' } = props
    const delay = show ? mouseEnterDelay : mouseLeaveDelay
    delayTimeout = setTimeout(
      () => {
        if (onVisibleChange) onVisibleChange(show)
        setIsShow(show)
        if (show && props.onOpen) props.onOpen()
        if (!show && props.onClose) props.onClose()

        if (show) {
          bindScrollDismiss(true)
          document.addEventListener('mousedown', clickAway)
        } else {
          bindScrollDismiss(false)
          document.removeEventListener('mousedown', clickAway)
        }
      },
      trigger === 'hover' ? delay : 0
    )
  };

  const getPositionStr = () => {
    let { position } = props
    const { priorityDirection = 'vertical' } = props
    if (position) return position

    const rect = parentElement.getBoundingClientRect()
    const horizontalPoint = rect.left + rect.width / 2
    const verticalPoint = rect.top + rect.height / 2
    const windowHeight = docSize.height
    const windowWidth = docSize.width
    let tempPriorityDirection = priorityDirection
    if (priorityDirection === 'auto') {
      const maxX = Math.max(rect.left, windowWidth - rect.left - rect.width)
      const maxY = Math.max(rect.top, windowHeight - rect.top - rect.height)
      tempPriorityDirection = maxX > maxY ? 'horizontal' : 'vertical'
    }

    if (tempPriorityDirection === 'horizontal') {
      if (horizontalPoint > windowWidth / 2) position = 'left'
      else position = 'right'

      if (verticalPoint > windowHeight * 0.6) {
        position += '-bottom'
      } else if (verticalPoint < windowHeight * 0.4) {
        position += '-top'
      }
    } else {
      if (verticalPoint > windowHeight / 2) position = 'top'
      else position = 'bottom'

      if (horizontalPoint > windowWidth * 0.6) {
        position += '-right'
      } else if (horizontalPoint < windowWidth * 0.4) {
        position += '-left'
      }
    }
    return position as PopoverPositionType
  };

  const getContainer = () => {
    const { getPopupContainer } = props
    let container
    if (getPopupContainer) container = getPopupContainer()
    if (container && isDOMElement(container)) {
      const child = document.createElement('div')
      child.setAttribute('style', ' position: absolute; top: 0px; left: 0px; width: 100% ')
      return container.appendChild(child)
    }
    return getCommonContainer()
  };

  const createContainer = () => {
    const { zIndex } = props
    if (!container || !isInDocument(container)) {
      container = getContainer()
      element.style.zIndex = String(zIndex)
      container.appendChild(element)
    }
  };

  const updatePosition = (position: PopoverPositionType) => {
    const pos = getPosition(position, parentElement, container)
    // eslint-disable-next-line
    Object.keys(pos).forEach((attr: keyof typeof pos) => {
      element.style[attr] = String(pos[attr])
    })
  };

  const bindEvents = () => {
    const { trigger = 'hover', clickToCancelDelay, mouseEnterDelay = DefaultProps.mouseEnterDelay } = props
    if (trigger === 'hover') {
      parentElement.addEventListener('mouseenter', handleShow)
      parentElement.addEventListener('mouseleave', handleHide)
      element.addEventListener('mouseenter', handleShow)
      element.addEventListener('mouseleave', handleHide)
      parentElement.removeEventListener('click', handleShow)
      if (clickToCancelDelay && mouseEnterDelay > 0) {
        parentElement.addEventListener('click', handleCancel)
      }
    } else {
      parentElement.addEventListener('click', handleShow)
      parentElement.removeEventListener('click', handleCancel)
      parentElement.removeEventListener('mouseenter', handleShow)
      parentElement.removeEventListener('mouseleave', handleHide)
      element.removeEventListener('mouseenter', handleShow)
      element.removeEventListener('mouseleave', handleHide)
    }
  };

  const clickAway = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (parentElement.contains(target)) return
    if (element.contains(target)) return
    if (getParent(target, `.${popoverClass('_')}`)) return
    handleHide(0)
  };

  const bindScrollDismiss = (show: boolean) => {
    const { scrollDismiss } = props
    if (!scrollDismiss) return
    let target: HTMLElement | Document = document
    if (typeof scrollDismiss === 'function') target = scrollDismiss() || document
    const method = show ? target.addEventListener : target.removeEventListener
    method.call(target, 'scroll', handleHide)
  };

  const bindChain = (id: string) => {
    chain.push(id);
  };

  const handleShow = () => {
    createContainer()
    if (delayTimeout) clearTimeout(delayTimeout)
    if (isShow) return
    setShow(true)
  };

  const isChildren = (el: HTMLElement) => {
    for (let i = 0; i < chain.length; i++) if (getParent(el, `.${chain[i]}`)) return true
    return false
  };

  const handleCancel = () => {
    if (delayTimeout) clearTimeout(delayTimeout)
  };

  const handleHide = (e?: MouseEvent | 0) => {
    if (e && isChildren(e.relatedTarget as HTMLElement)) return
    if (delayTimeout) clearTimeout(delayTimeout)
    setShow(false)
  };

  useEffect(() => {
    const { bindChain } = props
    if (bindChain) bindChain(id)

    parentElement = placeholderRef.current.parentElement!
    bindEvents()

    if (props.visible) {
      createContainer()
      setForceUpdateFlag(prev => !prev);
    }

    return () => {
      parentElement.removeEventListener('mouseenter', handleShow)
      parentElement.removeEventListener('mouseleave', handleHide)
      parentElement.removeEventListener('click', handleShow)

      document.removeEventListener('click', clickAway)
      document.removeEventListener('mousedown', clickAway)

      if (!container) return
      if (container === getCommonContainer()) {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element)
        }
      } else if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }, []);

  useEffect(() => {
    if (props.visible) {
      createContainer()
    }
    if (props.trigger) {
      bindEvents()
    }
    if (props.zIndex && element) {
      element.style.zIndex = String(props.zIndex)
    }
  }, [props]);

  const { background = '', border, children, type, visible, showArrow = true, useTextStyle, destroy } = props
  const show = typeof visible === 'boolean' ? visible : isShow
  if (((!isRendered || destroy) && !show) || !parentElement || !children) {
    return <noscript ref={placeholderRef} />
  }

  isRendered = true
  const colorStyle = { background, borderColor: border }
  const innerStyle = Object.assign({}, props.style, { background })
  const position = getPositionStr()
  // eslint-disable-next-line
  const style = element.style
  if (show) {
    // 先隐藏再设置样式这样可以减少回流
    style.display = 'none'
    updatePosition(position)
    if (background) style.background = background
    if (border) style.borderColor = border
    style.display = 'block'
  } else {
    style.display = 'none'
  }
  element.className = classnames(popoverClass('_', position, type), props.className, id)
  let childrened = isFunc(children) ? children(handleHide) : children
  if (typeof childrened === 'string' || useTextStyle)
    childrened = <span className={popoverClass('text')}>{childrened}</span>
  return ReactDOM.createPortal(
    [
      showArrow && <div key="arrow" className={popoverClass('arrow')} style={colorStyle} />,
      <div key="content" onClick={emptyEvent} className={popoverClass('content')} style={innerStyle}>
        <Provider value={bindChain}>
          <ScrollProvider value={{ element: undefined }}>
            <AbsoluteProvider value={false}>{childrened}</AbsoluteProvider>
          </ScrollProvider>
        </Provider>
      </div>,
    ],
    element
  );
}, (prevProps, nextProps) => {
  if (prevProps.visible === true || nextProps.visible === true) return true
  return false;
});

export default consumer(Panel)