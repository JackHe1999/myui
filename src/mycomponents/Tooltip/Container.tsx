import React, { useEffect, useState, CSSProperties, isValidElement, cloneElement, useRef } from "react";
import { tooltipClass } from "./styles";
import { scrollConsumer } from '../Scroll/context';
import { getUidStr } from '../utils/uid'
import { getPosition } from '../utils/dom/popover'
import { ContainerOptions, ContainerProps, ToolPosition, TriggerType } from "./Props";
import { ObjectType } from "../@types/common";

const DefaultProps = {
  animation: true,
  delay: 0,
  position: 'top' as ToolPosition,
  trigger: 'hover' as TriggerType,
};

export default function (options: ContainerOptions) {
  const { show, hide, move, isCurrent } = options;

  const Container = (props: ContainerProps) => {
    const { children, trigger, disabledChild, tip, scrollLeft, scrollTop } = props;
    const [id] = useState(getUidStr());
    const placeholderElementRef = useRef<HTMLElement>(null);
    let showTimer: any = null;

    useEffect(() => {
      if (!move || !isCurrent(id)) return;
      if (scrollLeft || scrollTop) {
        const pos = getElPosition()
        move(id, pos)
        tryHide()
      }

      return () => {
        hide()
      }
    }, [scrollLeft, scrollTop]);

    const getElement = () => {
      return placeholderElementRef.current?.nextSibling as HTMLElement;
    };

    const getElPosition = () => {
      const { position = DefaultProps.position } = props
      const el = getElement();
      return getPosition(position, el);
    };

    const tryHide = () => {
      const { scrollElement } = props;
      const rect = getElement().getBoundingClientRect();
      const scrollRect = scrollElement
        ? scrollElement.getBoundingClientRect()
        : { top: 0, bottom: 0, left: 0, right: 0 };

      if (
        rect.bottom < scrollRect.top ||
        rect.top > scrollRect.bottom ||
        rect.right < scrollRect.left ||
        rect.left > scrollRect.right
      ) {
        hide();
      }
    };

    const handleShow = () => {
      if (showTimer) clearTimeout(showTimer);
      const { delay } = props;
      if (!delay) {
        showSync();
      } else {
        showTimer = setTimeout(() => {
          showSync();
        }, delay);
      }
    };

    const handleDismiss = () => {
      clearTimeout(showTimer);
      hide();
    };

    const showSync = () => {
      const pos: any = getElPosition();
      type PosType = typeof pos;
      const style = Object.keys(pos).reduce(
        (data: any, key: any) => {
          data[key] = pos[key];
          return data;
        },
        {} as CSSProperties
      );
      const newProps = Object.assign({}, props, { style });
      show(newProps, id, props.style);
    };

    if (!isValidElement(children)) {
      console.error(new Error('Tooltip children expect a single ReactElement.'));
      return null;
    }

    if (!tip) return children;

    const inner = disabledChild ? (
      <span className={tooltipClass('disabled-wrapper')} style={{ cursor: 'not-allowed' }}>
        {cloneElement(children, { style: { ...children.props.style, pointerEvents: 'none' } } as any)}
      </span>
    ) : (
      children
    );

    const params: ObjectType = { key: 'el' }
    if (trigger === 'hover') {
      params.onMouseEnter = handleShow
      params.onMouseLeave = handleDismiss
    } else {
      params.onClick = (e: Event) => {
        if (e) e.stopPropagation()
        setTimeout(handleShow, 10)
        if (children.props.onClick) children.props.onClick()
      }
    }

    return [<noscript ref={placeholderElementRef} key="ns" />, cloneElement(inner, params)];
  }

  Container.defaultProps = DefaultProps;

  return scrollConsumer(Container as any);

}
