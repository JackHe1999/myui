import React, { CSSProperties, PureComponent, useEffect, useState } from 'react'
import classnames from 'classnames'
import { tabsClass } from './styles'
import { getUidStr } from '../utils/uid'
import { defer } from '../utils/uid'
import getDataset from '../utils/dom/getDataset'
import { getDirectionClass } from '../utils/classname'
import { TabProps } from './Props'

const Tab: React.FC<TabProps> = (props) => {
  const [uid] = useState(`tab_unique_${getUidStr()}`);
  let element: HTMLElement;

  const getActiveStyle = () => {
    const { shape, align, background, color, border, isActive, isVertical } = props;

    if (shape === 'line' || shape === 'dash') return {}

    const style: CSSProperties = { background, color }

    if (shape === 'bordered') return { background }

    if (shape !== 'line' && !isVertical)
      style.borderColor = `${border} ${border} ${isActive ? background : border} ${border}`;

    if (shape !== 'line' && align === 'vertical-left')
      style.borderColor = `${border} ${isActive ? background : border}  ${border} ${border}`;

    if (shape !== 'line' && align === 'vertical-right')
      style.borderColor = `${border} ${border} ${border} ${isActive ? background : border}`;

    return style;
  };

  const handleClick = (init: any) => {
    const { onClick, id, isActive, disabled, last, moveToCenter } = props;
    if (disabled) return;

    if (init !== true) onClick(id, isActive);
    if (!element) {
      element = document.querySelector(`.${uid}`)!;
    }
    if (element && element.getBoundingClientRect) {
      moveToCenter(element.getBoundingClientRect(), last, id === 0);
    }
  };

  useEffect(() => {
    defer(() => {
      if (props.isActive) handleClick(true);
    });
  }, []);

  const { isActive, disabled, children, shape, ...otherProps } = props;

  const style = getActiveStyle();
  const isBordered = shape === 'bordered';

  const newProps = {
    className: classnames(
      tabsClass(
        'tab',
        isActive && (isBordered ? 'tab-bordered-active' : 'active'),
        disabled && 'disabled',
        isBordered && getDirectionClass('tab-bordered')
      ),
      uid
    ),
    onClick: handleClick,
    style,
    ...getDataset(otherProps),
  };

  if (children.type && children.type.isTabLink) {
    return React.cloneElement(children, { ...newProps });
  }

  return (
    <div {...newProps}>{children}</div>
  );
};

export default Tab;