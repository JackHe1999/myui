import React, { Children, ReactElement, useEffect, useRef, useState } from 'react'
import classnames from 'classnames'
import Header from './Header'
import getDataset from '../utils/dom/getDataset'
import Wrapper from './Wrapper'
import Sticky from '../Sticky'
import { StickyProps } from '../Sticky/Props'
import { tabsClass } from './styles'
import { isEmpty, isObject } from '../utils/is'
import { isRTL } from '../config'
import { TabsProps, TabsChildProps, TabsBaseValue } from './Props'
import Panel from './Panel'
import Link from './Link'

interface TabsState {
  active: string | number
  collapsed?: boolean
}

const DefaultValue = {
  defaultCollapsed: false,
  lazy: true,
  hideSplit: false,
};

const Tabs = (props: TabsProps) => {
  const [state, setState] = useState<TabsState>({
    active: props.defaultActive || 0,
    collapsed: props.defaultCollapsed,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  let newSticky: boolean;

  const getAlign = () => {
    const { shape, collapsible, align } = props
    const isVertical = align && align.indexOf('vertical') > -1
    if (shape === 'button' && isVertical) {
      console.warn("align vertical-* can't supported when shape is button")
      return { align: 'left', isVertical: false }
    }

    if (collapsible && isVertical) {
      console.warn("align vertical-* can't supported when collapsible is true")
      return { align: 'left', isVertical: false }
    }

    return { align, isVertical }
  };

  const getActive = () => {
    if ('active' in props) return props.active;
    return state.active;
  };

  const setStickyStatus = (flag: boolean) => {
    const { sticky, switchToTop } = props
    if (!sticky || !switchToTop) return
    newSticky = flag
  };

  const handleChange = (active: any) => {
    const { onChange } = props
    if (onChange) onChange(active)
    setState({ ...state, active })
  };

  const handleCollapse = (collapsed: boolean) => {
    setState({ ...state, collapsed });
  };

  const renderHeader = ({ align, isVertical }: any) => {
    const {
      children,
      color,
      shape,
      tabBarStyle,
      inactiveBackground,
      collapsible,
      tabBarExtraContent,
      sticky,
      hideSplit,
    } = props
    const active = getActive()
    const tabs: TabsChildProps[] = []

    let { border } = props
    Children.toArray(children).forEach(
      (child: any, i, arr) => {
        if (!child || !child.type) return

        let tab = null
        if (child.type.isTabPanel) {
          // eslint-disable-next-line
          tab = child.props.tab
        } else if (child.type.isTabLink) {
          tab = child
        } else return

        const { id = i, background } = child.props
        let childBorder = child.props.border
        // eslint-disable-next-line
        if (active === id) {
          if (childBorder) border = childBorder
          else childBorder = border
        }

        tabs.push({
          id,
          isActive: active === id,
          tab,
          isVertical,
          align,
          background: background || (active === id ? props.background : inactiveBackground),
          border: childBorder,
          color: child.props.color || (active === id ? color : undefined),
          disabled: child.props.disabled,
          shape,
          last: arr.length - 1 === i,
          ...getDataset(child.props),
        })
      }
    )

    const header = (
      <Header
        isVertical={isVertical}
        border={border}
        collapsed={state.collapsed}
        onCollapse={collapsible ? handleCollapse : undefined}
        shape={shape}
        onChange={handleChange}
        tabs={tabs}
        tabBarExtraContent={tabBarExtraContent}
        tabBarStyle={tabBarStyle}
        hideSplit={hideSplit}
      />
    )

    if (!isEmpty(sticky) && !isVertical) {
      const stickyClassName = tabsClass('sticky')
      let stickyProps: { top?: number | undefined; className: string } = {
        top: 0,
        className: stickyClassName,
      }
      if (typeof sticky === 'number') {
        stickyProps.top = sticky
      }
      if (isObject(sticky)) {
        stickyProps = {
          ...(sticky as StickyProps),
          className: classnames(stickyClassName, (sticky as StickyProps).className),
        }
      }
      return (
        <Sticky onChange={setStickyStatus} {...stickyProps}>
          {header}
        </Sticky>
      )
    }
    return header
  };

  const renderContent = (child: any, i: number) => {
    if (!(child && child.type && child.type.isTabPanel)) return null
    const { collapsible, lazy } = props
    const { id = i, ...other } = child.props

    return (
      <Wrapper
        {...other}
        lazy={lazy}
        collapsed={state.collapsed}
        collapsible={collapsible}
        id={id}
        key={id}
        active={getActive()}
      />
    )
  };

  const { children, shape, style, autoFill } = props
  const position = getAlign()
  const { align, isVertical } = position
  const className = classnames(
    tabsClass(
      '_',
      align && `align-${align}`,
      isVertical && 'vertical',
      shape,
      autoFill && 'auto-fill',
      isRTL() && 'rtl'
    ),
    props.className
  )

  useEffect(() => {
    const { sticky, switchToTop, active } = props

    if (
      containerRef &&
      !isEmpty(sticky) &&
      switchToTop &&
      newSticky
    ) {
      // jump to active panel
      containerRef.current!.scrollIntoView(true)
    }
  }, []);

  return (
    <div className={className} style={style} ref={containerRef}>
      {align !== 'vertical-right' && align !== 'bottom' && renderHeader(position)}
      {Children.toArray(children).map(renderContent)}
      {(align === 'vertical-right' || align === 'bottom') && renderHeader(position)}
    </div>
  )
};

Tabs.defaultProps = DefaultValue;
Tabs.Panel = Panel;
Tabs.Link = Link;
Tabs.displayName = 'myuiTabs';

export default Tabs;