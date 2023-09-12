import React, { useEffect, useRef, useState } from 'react'
import immer from 'immer'
import { addResizeObserver } from '../utils/dom/element'
import Button from '../Button'
import icons from '../icons'
import Tab from './Tab'
import { tabsClass } from './styles'
import { isRTL } from '../config'
import { HeaderProps, TabsChildProps } from './Props'

interface HeaderState {
  attribute: number
  overflow: boolean
  attributeString?: string
}

const REDUNDANT = 30;

const Header: React.FC<HeaderProps> = (props) => {
  const [state, setState] = useState<HeaderState>({
    attribute: 0,
    overflow: false,
  });
  const wrapperRef = useRef(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(null);
  let ignoreNextCollapse: boolean;
  let removeObserver: () => void;

  const setPosition = (isVertical?: boolean) => {
    const attributeString = isVertical ? 'Height' : 'Width';
    if (!innerRef.current) return;
    const innerAttribute = innerRef.current[`client${attributeString}`];
    const scrollAttribute = scrollRef.current![`client${attributeString}`];
    const { attribute: domAttribute } = state;
    setState({ ...state, overflow: scrollAttribute > domAttribute + innerAttribute, attributeString });
  };

  const handleResize = (_entry: HTMLElement, { x, y }: { x: boolean; y: boolean }) => {
    const { isVertical } = props;
    const isResize = isVertical ? y : x;
    if (isResize) setPosition(isVertical);
  };

  const handleMove = (lt: boolean) => {
    const { attributeString, attribute: a } = state;
    const innerAttribute = innerRef.current![`client${attributeString}` as keyof HTMLElement] as number;
    const scrollAttribute = scrollRef.current![`client${attributeString}` as keyof HTMLElement] as number;
    let attribute = a + (lt ? -innerAttribute : innerAttribute);
    if (attribute < 0) attribute = 0;
    if (attribute + innerAttribute > scrollAttribute) attribute = scrollAttribute - innerAttribute;
    if (scrollAttribute <= innerAttribute) attribute = 0;
    setState({ ...state, attribute });
  };

  const moveToCenter = (tabRect: DOMRect, last: boolean, first: boolean) => {
    const { isVertical } = props;
    const positions: ['top', 'bottom'] | ['left', 'right'] = isVertical ? ['top', 'bottom'] : ['left', 'right'];
    const rect = innerRef.current!.getBoundingClientRect();
    const d = isRTL() && !isVertical ? -1 : 1;
    if (tabRect[positions[0]] < rect[positions[0]]) {
      setState(
        immer(draft => {
          draft.attribute -= (rect[positions[0]] - tabRect[positions[0]] + (first ? 0 : REDUNDANT)) * d
        })
      )
    } else if (tabRect[positions[1]] > rect[positions[1]]) {
      setState(
        immer(draft => {
          draft.attribute +=
            (tabRect[positions[1]] - rect[positions[1]] - (draft.attribute === 0 ? -30 : 0) + (last ? 0 : REDUNDANT)) *
            d
        })
      )
    }
  };

  const handleClick = (id: string | number, isActive: boolean) => {
    if (!isActive) {
      if (props.onChange) props.onChange(id);
      ignoreNextCollapse = true;
      setTimeout(() => handleCollapse(false), 200);
    }
  };

  const handleCollapse = (e: React.MouseEvent<HTMLDivElement> | boolean) => {
    const { onCollapse, collapsed } = props;
    if (!onCollapse) return;

    if (typeof e === 'boolean') {
      onCollapse(e);
      return;
    }

    if (ignoreNextCollapse) {
      ignoreNextCollapse = false;
      return;
    }

    onCollapse(!collapsed);
  };

  const renderTab = ({ tab, id, ...other }: TabsChildProps) => {
    return (
      <Tab {...other} key={id} id={id} moveToCenter={moveToCenter} onClick={handleClick}>
        {tab}
      </Tab>
    );
  };

  const renderButtons = () => {
    const { onChange, tabs } = props;
    return (
      <Button.Group className={tabsClass('header-button')}>
        {tabs.map(tab => (
          <Button
            key={tab.id}
            onClick={tab.isActive ? undefined : onChange.bind(this, tab.id)}
            className={tabsClass(tab.isActive && 'button-active')}
            disabled={tab.disabled}
          >
            {tab.tab}
          </Button>
        ))}
      </Button.Group>
    )
  };

  const renderTabs = () => {
    const { tabs } = props;
    return tabs.map(renderTab);
  };

  useEffect(() => {
    const { isVertical } = props;
    setPosition(isVertical);
    removeObserver = addResizeObserver(innerRef.current!, handleResize, { direction: true, timer: 100 });
    return () => {
      if (removeObserver) {
        removeObserver();
      }
    }
  }, []);

  const { border, onCollapse, collapsed, isVertical, tabBarExtraContent, tabBarStyle, shape, hideSplit } = props;
  const { attribute, overflow } = state;

  const hor = isRTL() ? 'Right' : 'Left';
  const position = isVertical ? 'Top' : hor;
  const showBorder = shape !== 'bordered' && shape !== 'dash' && !hideSplit;

  return (
    <div onClick={handleCollapse} className={tabsClass('header')} style={tabBarStyle || {}}>
      <div ref={wrapperRef} className={tabsClass('header-tabs')}>
        {onCollapse && <span className={tabsClass('indicator', collapsed && 'collapsed')}>{icons.AngleRight}</span>}
        {attribute > 0 && (
          <div onClick={() => handleMove(true)} className={tabsClass('scroll-prev')}>
            {icons.AngleLeft}
          </div>
        )}
        <div ref={innerRef} className={tabsClass('inner')}>
          <div ref={scrollRef} style={{ [`margin${position}`]: -attribute }} className={tabsClass('scroll')}>
            {shape === 'button' ? renderButtons() : renderTabs()}
          </div>
        </div>
        {overflow && (
          <div onClick={() => handleMove(false)} className={tabsClass('scroll-next')}>
            {isVertical ? icons.AngleRight : icons.AngleRight}
          </div>
        )}
      </div>
      {tabBarExtraContent && <div className={tabsClass('extra')}>{tabBarExtraContent}</div>}
      {showBorder && shape !== 'button' && <div style={{ borderColor: border }} className={tabsClass('hr')} />}
    </div>
  );
}

export default Header;