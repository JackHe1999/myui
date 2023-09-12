import React, { Component, ComponentType, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'
import shallowEqual from '../utils/shallowEqual'
import { compose } from '../utils/func'
import { scrollConsumer } from '../Scroll/context'
import { listClass } from './styles'
import { docSize } from '../utils/dom/document'
import { getRTLPosition } from '../utils/strings'
import zIndexConsumer from '../Modal/context'
import { isRTL, getDefaultContainer } from '../config'
import { addZoomListener, removeZoomListener } from '../utils/zoom'
import { isInDocument } from '../utils/dom/isInDocument'
import { AbsoluteProps, GetAbsoluteProps } from './Props'

const PICKER_V_MARGIN = 4
let root: HTMLDivElement

function initRoot(element?: HTMLElement) {
  const defaultContainer = getDefaultContainer()
  root = document.createElement('div')
  root.className = listClass('root', isRTL() && 'rtl')
  defaultContainer.appendChild(root)

  if (element && isInDocument(element) === false) {
    root.appendChild(element)
  }
}

function getRoot(element?: HTMLElement) {
  if (!root || isInDocument(root) === false) initRoot(element)

  if (element && isInDocument(element) === false) {
    root.appendChild(element)
  }
  return root
}

const getOverDocStyle = (right: boolean) => (right ? { left: 0, right: 'auto' } : { right: 0, left: 'auto' })

const listPosition = ['drop-down', 'drop-up']
const pickerPosition = ['left-bottom', 'left-top', 'right-bottom', 'right-top']
const dropdownPosition = ['bottom-left', 'bottom-right', 'top-left', 'top-right']

export default function <U extends {}>(List: ComponentType<U>) {
  const AbsoluteList = (props: AbsoluteProps) => {

    const getContainer = (element?: HTMLElement) => {
      return typeof props.absolute === 'function' ? props.absolute() : getRoot(element);
    };

    let lastStyle: React.CSSProperties = {};
    let container: HTMLElement = getContainer();
    let element: HTMLElement = document.createElement('div');
    let ajustdoc: boolean;
    let containerRect: DOMRect;
    let containerScroll: { left: number; top: number };
    const [state, setState] = useState({ overdoc: false });
    const elRef = useRef<HTMLElement>(null);
    const [forceUpdateFlag, setForceUpdateFlag] = useState(false);

    const forceUpdate = () => {
      setForceUpdateFlag(prevFlag => !prevFlag);
    };

    const getPosition = (rect: DOMRect) => {
      const { fixed } = props;
      let { position } = props as { position: string };
      const rtl = isRTL();
      const style: React.CSSProperties = {
        position: 'absolute',
        right: 'auto',
      };
      if (fixed) {
        const widthKey = fixed === 'min' ? 'minWidth' : 'width';
        style[widthKey] = rect.width;
      }
      if (dropdownPosition.includes(position)) {
        position = position
          .split('-')
          .reverse()
          .join('-');
      }

      if (rtl) {
        position = getRTLPosition(position);
      }
      const container = getContainer(element);
      const defaultContainer = getDefaultContainer();
      const rootContainer = container === getRoot() || !container ? defaultContainer : container;
      const newContainerRect = rootContainer.getBoundingClientRect();
      const newContainerScroll = {
        left: rootContainer.scrollLeft,
        top: rootContainer.scrollTop,
      }
      containerRect = newContainerRect
      containerScroll = newContainerScroll

      if (listPosition.includes(position)) {
        style.left = rect.left - newContainerRect.left + newContainerScroll.left;
        if (isRTL()) {
          style.right = newContainerRect.width - rect.width - style.left;
          style.left = 'auto';
        }
        if (position === 'drop-down') {
          style.top = rect.top - newContainerRect.top + rect.height + newContainerScroll.top;
        } else {
          style.bottom = -(rect.top - newContainerRect.top + newContainerScroll.top);
        }
      } else if (pickerPosition.includes(position)) {
        const [h, v] = position.split('-');
        if (h === 'left') {
          style.left = rect.left - newContainerRect.left + newContainerScroll.left;
        } else {
          style.right = newContainerRect.width - rect.width - rect.left + newContainerRect.left - newContainerScroll.left;
          style.left = 'auto';
        }
        if (v === 'bottom') {
          style.top = rect.bottom - newContainerRect.top + newContainerScroll.top + PICKER_V_MARGIN;
        } else {
          style.top = rect.top - newContainerRect.top + newContainerScroll.top - PICKER_V_MARGIN;
          style.transform = 'translateY(-100%)';
        }
      }
      return style;
    };

    const getStyle = () => {
      const { parentElement, scrollElement, focus } = props;
      const lazyResult = { focus, style: lastStyle };
      if (!focus) return lazyResult;
      let style = {};
      if (parentElement) {
        const rect = parentElement.getBoundingClientRect();
        const scrollRect: any = scrollElement ? scrollElement.getBoundingClientRect() : {};

        if (
          rect.bottom < scrollRect.top ||
          rect.top > scrollRect.bottom ||
          rect.right < scrollRect.left ||
          rect.left > scrollRect.right
        ) {
          return { focus: false, style: lastStyle };
        }
        style = getPosition(rect);
      }

      if (shallowEqual(style, lastStyle)) return lazyResult;

      lastStyle = style;
      return { focus, style };
    };

    const zoomChangeHandler = () => {
      if (props.focus) {
        forceUpdate();
      }
    };

    const isRight = () => {
      const { position } = props;
      let isRight = false;
      if (position && position.indexOf('right') > 1) {
        isRight = true;
      }
      if (isRTL()) {
        isRight = !isRight;
      }
      return isRight;
    };

    const resetPosition = (clean?: boolean) => {
      const { focus, parentElement } = props
      if (!elRef.current || !focus || (ajustdoc && !clean)) return
      const width = elRef.current!.offsetWidth
      const pos = (parentElement && parentElement.getBoundingClientRect()) || { left: 0, right: 0 }
      const newContainerRect = containerRect || { left: 0, width: 0 }
      const newContainerScroll = containerScroll || { left: 0 }
      let overdoc
      if (isRight()) {
        if (isRTL() && newContainerScroll.left) {
          // this condition  the style left: 0 will not meet expect so not set overdoc
          overdoc = false
        } else {
          overdoc = pos.right - width < newContainerRect.left
        }
      } else if (!isRTL() && newContainerScroll.left) {
        // this condition  the style right: 0 will not meet expect so not set overdoc
        overdoc = false
      } else {
        overdoc = pos.left - newContainerRect.left + width + newContainerScroll.left > (newContainerRect.width || docSize.width)
      }
      if (state.overdoc === overdoc) return
      ajustdoc = true
      setState({
        overdoc,
      })
    };

    const renderList = () => {
      const {
        parentElement,
        absolute,
        focus,
        rootClass,
        position,
        scrollLeft,
        scrollTop,
        scrollElement,
        style = {},
        zIndex,
        getResetPosition,
        autoAdapt: ignore,
        ...otherProps
      } = props
      if (zIndex !== undefined) {
        const parsed = parseInt((zIndex as unknown) as string, 10)
        if (!Number.isNaN(parsed)) style.zIndex = parsed
      }

      const mergeStyle = Object.assign({}, style, state.overdoc ? getOverDocStyle(isRight()) : undefined)
      return <List getRef={elRef} {...otherProps as U} focus={focus} style={mergeStyle} />
    }

    useEffect(() => {
      if (props.absolute && !container) {
        container = getContainer()
        container.appendChild(element)
        if (props.focus) {
          forceUpdate()
        }
      }
      if (props.absolute) {
        addZoomListener(zoomChangeHandler)
      }

      return () => {
        if (!props.absolute) return
        removeZoomListener(zoomChangeHandler)
        if (container) {
          if (element && element.parentNode) element.parentNode.removeChild(element)
        }
      }
    }, []);

    useEffect(() => {
      if (!props.focus) ajustdoc = false
      setTimeout(() => {
        forceUpdate()
      })
    }, [props.value]);

    const { autoAdapt } = props
    setTimeout(() => {
      resetPosition(autoAdapt)
    })
    if (!props.absolute) {
      return renderList()
    }
    if (!container) return null
    const {
      parentElement,
      rootClass,
      absolute,
      position,
      scrollLeft,
      scrollTop,
      scrollElement,
      autoClass,
      zIndex,
      // do not need the getUpdate
      getResetPosition,
      // do not need the value
      value,
      autoAdapt: ignore,
      ...otherProps
    } = props
    const mergeClass = classnames(listClass('absolute-wrapper'), rootClass, autoClass)
    const { focus, style } = otherProps.focus ? getStyle() : { style: lastStyle, focus: undefined }
    element.className = mergeClass
    const mergeStyle = Object.assign(
      {},
      style,
      otherProps.style,
      state.overdoc ? getOverDocStyle(isRight()) : undefined
    )
    if (zIndex || typeof zIndex === 'number') mergeStyle.zIndex = parseInt((zIndex as unknown) as string, 10)
    return ReactDOM.createPortal(
      <List getRef={elRef} {...otherProps as U} focus={focus} style={mergeStyle} />,
      element
    )
  };

  return compose(
    scrollConsumer,
    zIndexConsumer
  )(AbsoluteList) as ComponentType<GetAbsoluteProps<U>>
}