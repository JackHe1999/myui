import React from 'react'
import classnames from 'classnames'
import List from '../AnimationList'
import { tabsClass } from './styles'
import { PanelProps } from './Props'

const CollapseList = List(['collapse'], 'fast');

const Panel = (props: PanelProps) => {
  let isPristine: boolean = true;

  const { children, background, color, isActive, collapsible, collapsed, lazy } = props;
  if (!isActive && isPristine && lazy) return null
  isPristine = false;

  const style = Object.assign({ background: background || '#fff', color }, props.style)
  const className = classnames(tabsClass('panel', isActive && 'show'), props.className)

  const result = (
    <div style={style} className={className}>
      {children}
    </div>
  )

  if (!collapsible) return result

  return (
    <CollapseList show={!collapsed}>{result}</CollapseList>
  );
};

Panel.isTabPanel = true;

export default Panel;