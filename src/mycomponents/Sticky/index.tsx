import React, { useEffect, useRef, useState } from 'react'
import { getParent } from '../utils/dom/element'
import { eventPassive } from '../utils/dom/detect'
import { defaultProps } from '../utils/defaultProps'
import { compose } from '../utils/func'
import { cssSupport, copyBoundingClientRect } from '../utils/dom/element'
import { docSize } from '../utils/dom/document'
import { consumer } from './context'
import { StickyProps, Mode, StickyType } from './Props'

const events = ['scroll', 'pageshow', 'load']
const supportSticky = cssSupport('position', 'sticky')
const defaultZIndex = 900
const DefaultValue = {
  ...defaultProps,
  css: true,
}

interface StickyState {
  mode?: Mode | string
  scrollWidth?: number
  placeholder?: React.CSSProperties | null
  style?: React.CSSProperties
}

const Sticky = (props: StickyProps) => {
  const [state, setState] = useState<StickyState>({});
  let style: React.CSSProperties = {};
  let targetElement: Element | null;
  const elementRef = useRef(null);
  let scrollTimer: NodeJS.Timer;
  const placeholderRef = useRef(null);
  const originRef = useRef<HTMLDivElement>(null);
  let locked: boolean;
  let scrollCount: number;

  const shouldUseCss = () => {
    const { css } = props;
    if (css && supportSticky && targetElement) {
      return true;
    }
    return false;
  };

  const getStyle = (mode: Mode, offset: number, left?: number, width?: number) => {
    const { zIndex = 900 } = props.style!;
    const { css } = props;

    const style: React.CSSProperties = {
      position: 'fixed',
      left,
      width,
      [mode]: offset,
      zIndex,
    };
    if (targetElement) {
      if (supportSticky && css) {
        style.position = 'sticky';
      } else {
        style.position = 'absolute';
        if (mode === 'top') {
          style.transform = `translateY(${offset + targetElement.scrollTop}px)`;
        } else {
          style.transform = `translateY(${targetElement.scrollTop}px)`;
        }
        delete style.left;
      }
    }

    triggerChange(true, style);

    return style;
  };

  const setPosition = () => {
    const { bottom, top, target, css, needResetPostion } = props;
    const { mode, scrollWidth } = state;
    // If it is a hidden element, the position will not be updated
    if (needResetPostion === false) return

    const selfRect = copyBoundingClientRect(elementRef.current!);

    if (selfRect === null) return;
    // If the element is hidden, the width and height will be 0
    if (selfRect && selfRect.width === 0 && selfRect.height === 0) return;

    const { marginBottom, marginTop } = getComputedStyle(elementRef.current!)
    selfRect.height += parseFloat(marginBottom) + parseFloat(marginTop)
    const scrollElement = targetElement || document.body
    const scrollRect = scrollElement.getBoundingClientRect()

    const placeholderRect = placeholderRef ? copyBoundingClientRect(placeholderRef.current!) : null
    const viewHeight = docSize.height

    if (originRef) {
      const { width } = originRef.current!.getBoundingClientRect()
      selfRect.width = width
      if (placeholderRect) placeholderRect.width = width
    }

    const placeholderStyle = {
      width: selfRect.width,
      // if target element is not null, set height to 0
      height: target && supportSticky && css ? 0 : selfRect.height,
    }

    let newStyle: any
    let placeholder: any

    if (top !== undefined && mode !== 'bottom') {
      let limitTop = top
      if (targetElement) {
        const { paddingTop } = getComputedStyle(scrollElement)
        limitTop += scrollRect.top + parseInt(paddingTop, 10)
      }
      if (Math.ceil(selfRect.top) < limitTop) {
        setState((prevState) => ({ ...prevState, scrollWidth: scrollRect.width, mode: 'top' }))
        newStyle = getStyle('top', top, selfRect.left, selfRect.width)
        placeholder = placeholderStyle
      } else if (placeholderRect && selfRect.top < placeholderRect.top) {
        if (scrollRect.width !== selfRect.width) {
          newStyle = getStyle('top', top, selfRect.left, scrollRect.width)
        }
        if (!(target && selfRect.top === limitTop)) {
          setState((prevState) => ({ ...prevState, mode: '' }))
          newStyle = {}
          placeholder = null
          triggerChange(false, newStyle)
        }
      } else if (targetElement && placeholderRect) {
        newStyle = getStyle('top', top, selfRect.left, selfRect.width)
        placeholder = placeholderStyle
      } else if (scrollWidth && placeholderRect && scrollWidth !== scrollRect.width) {
        setState((prevState) => ({ ...prevState, scrollWidth: scrollRect.width, mode: 'top' }))
        newStyle = getStyle('top', top, placeholderRect.left, placeholderRect.width)
        placeholder = placeholderStyle
      }
    }

    if (bottom !== undefined && mode !== 'top') {
      let limitBottom = viewHeight - bottom

      if (targetElement) {
        const { paddingBottom } = getComputedStyle(scrollElement)
        limitBottom = scrollRect.bottom - bottom! - parseInt(paddingBottom, 10)
      }

      if (selfRect.bottom > limitBottom) {
        setState((prevState) => ({ ...prevState, scrollWidth: scrollRect.width, mode: 'bottom' }))
        newStyle = getStyle('bottom', bottom, selfRect.left, selfRect.width)
        placeholder = placeholderStyle
      } else if (
        placeholderRect &&
        (targetElement ? scrollRect.bottom : selfRect.bottom) > placeholderRect.bottom
      ) {
        if (scrollRect.width !== selfRect.width) {
          newStyle = getStyle('bottom', bottom, selfRect.left, scrollRect.width)
        }
        if (!(target && selfRect.bottom === limitBottom)) {
          setState((prevState) => ({ ...prevState, mode: '' }))
          newStyle = {}
          placeholder = null
          triggerChange(false, newStyle)
        }
      } else if (targetElement && placeholderRect) {
        newStyle = getStyle('bottom', bottom, selfRect.left, selfRect.width)
        placeholder = placeholderStyle
      } else if (scrollWidth && placeholderRect && scrollWidth !== scrollRect.width) {
        setState((prevState) => ({ ...prevState, scrollWidth: scrollRect.width, mode: 'bottom' }))
        newStyle = getStyle('bottom', bottom, placeholderRect.left, placeholderRect.width)
        placeholder = placeholderStyle
      }
    }

    if (placeholder !== undefined) {
      setState((prevState) => ({ ...prevState, placeholder }))
    }

    if (newStyle) {
      style = newStyle as React.CSSProperties
      setState((prevState) => ({ ...prevState, style: newStyle }))
    }
  };

  const triggerChange = (flag: boolean, newStyle: React.CSSProperties) => {
    const { onChange } = props;
    if (newStyle.position === style.position) return;
    if (typeof onChange === 'function') onChange(flag);
  };

  const handlePosition = () => {
    const { css } = props;
    if (locked && css) {
      scrollCount += 1
      return
    }

    locked = true
    scrollCount = 0
    setPosition()
    scrollTimer = setTimeout(() => {
      locked = false
      if (scrollCount > 0) {
        handlePosition()
      }
    }, 48)
  };

  const bindScroll = () => {
    if (targetElement) {
      targetElement.addEventListener('scroll', handlePosition, eventPassive)
    } else {
      events.forEach(e => {
        window.addEventListener(e, handlePosition)
      })
    }
    window.addEventListener('resize', handlePosition)
  };

  const unbindScroll = () => {
    if (targetElement) {
      targetElement.removeEventListener('scroll', handlePosition)
    } else {
      events.forEach(e => {
        window.removeEventListener(e, handlePosition)
      })
    }
    window.removeEventListener('resize', handlePosition)
  };

  useEffect(() => {
    const { target } = props;
    targetElement = getParent(elementRef.current, target);
    handlePosition();

    if (!shouldUseCss()) {
      bindScroll();
    }
    return () => {
      unbindScroll();
      if (scrollTimer) clearTimeout(scrollTimer);
    }
  }, []);

  useEffect(() => {
    setPosition();
  }, [props.needResetPostion]);

  const { children, className, target, css, top, bottom } = props;
  const { placeholder } = state;

  let outerStyle = props.style;
  let innerStyle = state.style;

  if (target && supportSticky && css) {
    outerStyle = Object.assign({ zIndex: defaultZIndex }, outerStyle, { position: 'sticky', top, bottom })
    innerStyle = {}
  }

  return (
    <div style={outerStyle} className={className}>
      <div ref={elementRef} style={Object.assign({}, innerStyle, { display: 'flow-root' })}>
        {children}
      </div>
      <div ref={originRef} />
      {placeholder && <div ref={placeholderRef} style={placeholder} />}
    </div>
  );

};

Sticky.displayName = 'myuiSticky';
Sticky.defaultProps = DefaultValue;

export default Sticky;