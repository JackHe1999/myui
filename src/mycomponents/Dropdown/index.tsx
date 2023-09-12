import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { defaultProps } from '../utils/defaultProps'
import { getParent } from '../utils/dom/element'
import Button from '../Button'
import { dropdownClass } from './styles'
import List from '../AnimationList'
import Item from './Item'
import { docSize } from '../utils/dom/document'
import absoluteList from '../AnimationList/AbsoluteList'
import { getUidStr } from '../utils/uid'
import { isFunc } from '../utils/is'
import absoluteComsumer from '../Table/context'
import Caret from '../icons/Caret'
import { isRTL } from '../config'
import { getDirectionClass } from '../utils/classname'
import getDataset from '../utils/dom/getDataset'
import { DropdownProps, DropdownNode, DropdownType } from './Props'

const positionMap = {
  'left-top': 'left-top',
  'left-bottom': 'left-bottom',
  'right-top': 'right-top',
  'right-bottom': 'right-bottom',
  'top-right': 'left-bottom',
  'top-left': 'right-bottom',
  'bottom-right': 'left-top',
  'bottom-left': 'right-top',
  auto: '',
}

const DefaultProps = {
  ...defaultProps,
  data: [],
  animation: true,
  disabled: false,
  trigger: 'click',
  position: 'bottom-left',
}

interface DropDownState {
  show: boolean
}

const Dropdown = (props: DropdownProps) => {

  let lastFocus: boolean;
  const elementRef = useRef<HTMLDivElement>(null);
  const [dropdownId] = useState(`dropdown_${getUidStr()}`);
  let closeTimer: NodeJS.Timeout;
  const FadeList = List('fade', props.animation ? 'fast' : 0);
  // @ts-ignore
  const DropdownList: any = useMemo(() => absoluteList(({ focus, ...other }) => <FadeList show={focus} {...other} />), []);
  const [state, setState] = useState<DropDownState>({ show: false });
  
  const show = () => {
    if ('open' in props) {
      return !!props.open;
    }
    return state.show;
  };

  const toggleDocumentEvent = (bind: boolean) => {
    const method = bind ? 'addEventListener' : 'removeEventListener';
    document[method]('mousedown', (clickAway as unknown) as EventListener, true);
  };

  const setOpenEvent = () => {
    if (lastFocus !== show()) {
      if (show()) {
        toggleDocumentEvent(true);
      } else if (lastFocus !== undefined) {
        toggleDocumentEvent(false);
      }
    }
    lastFocus = show();
  };

  const getTrigger = () => {
    // @ts-ignore
    if (props.hover === true) return 'hover';
    return props.trigger;
  };

  const getPosition = () => {
    let { position } = props;

    if (position !== 'auto') return position;
    if (!elementRef.current) return 'bottom-left';
    const windowHeight = docSize.height;
    const windowWidth = docSize.width;
    const rect = elementRef.current!.getBoundingClientRect();
    const prefix = rect.bottom > windowHeight / 2 ? 'top-' : 'bottom-';
    const suffix = rect.right > windowWidth / 2 ? 'right' : 'left';
    position = (prefix + suffix) as keyof DropdownProps['position'];

    return position;
  };
  
  const clickAway = (e: React.MouseEvent) => {
    const { absolute } = props;
    const el = getParent(e.target as HTMLElement, 'a');
    const onSelf = absolute
      ? getParent(e.target as HTMLElement, `[data-id=${dropdownId}]`)
      : el === elementRef.current || elementRef.current!.contains(el);
    if (el && onSelf && el.getAttribute('data-role') === 'item') return;
    handleHide(0);
  };

  const handleFocus = () => {
    const { onCollapse } = props;
    if (closeTimer) {
      clearTimeout(closeTimer);
    }
    if (show()) return;
    if (onCollapse) onCollapse(true);
    setState({
      show: true,
    });
  };

  const handleHide = (delay = 200) => {
    const { onCollapse } = props;
    closeTimer = setTimeout(() => {
      if (onCollapse) onCollapse(false);
      setState({ show: false });
    }, delay);
  };

  const handleToggle = (show: boolean) => {
    const { disabled } = props;
    if (disabled === true) return

    if (getTrigger() === 'click') return

    if (show) {
      handleFocus();
    } else handleHide();
  };

  const renderRTLButton = (placeholder: string, spanClassName: string, caret: ReactNode, buttonClassName: string) => {
    const { isSub, type, outline, size, disabled } = props;
    if (isSub) {
      return (
        <a
          key="button"
          className={dropdownClass('button', 'item', show() && 'active')}
          data-role="item"
          onClick={handleFocus}
        >
          <span className={spanClassName}>{placeholder}</span>
          {caret}
        </a>
      );
    }
    return (
      <Button
        disabled={disabled}
        onClick={handleFocus}
        outline={outline}
        className={buttonClassName}
        type={type}
        size={size}
        key="button"
      >
        <span className={spanClassName}>{placeholder}</span>
        {caret}
      </Button>
    );
  };

  const renderButton = (placeholder: ReactNode) => {
    const { type, outline, size, disabled, isSub, position } = props;
    const rtl = isRTL();
    const buttonClassName = dropdownClass('button', !placeholder && 'split-button', rtl && 'rtl');
    const spanClassName = dropdownClass('button-content');
    const caret = (
      <span key="caret" className={dropdownClass('caret', rtl && 'rtl')}>
        <Caret />
      </span>
    );
    const childs = [
      <span key="text" className={spanClassName}>
        {placeholder}
      </span>,
      caret,
    ];
    if (['left-bottom', 'left-top'].includes(position!)) {
      childs.reverse();
    }
    if (isSub) {
      return (
        <a
          key="button"
          className={dropdownClass('button', 'item', show() && 'active')}
          data-role="item"
          onClick={handleFocus}
        >
          {childs}
        </a>
      );
    }

    return (
      <Button
        disabled={disabled}
        onClick={handleFocus}
        outline={outline}
        className={buttonClassName}
        type={type}
        size={size}
        key="button"
      >
        {childs}
      </Button>
    )
  };

  const renderList = (data: DropdownProps['data'], placeholder: DropdownProps['placeholder'], position?: string) => {
    const { width, onClick, columns, renderItem, absolute } = props;
    if (!Array.isArray(data) || data.length === 0) return null;
    
    return (
      <>
        <DropdownList
          absolute={absolute}
          parentElement={elementRef.current}
          position={position}
          className={dropdownClass(
            getDirectionClass('menu'),
            columns !== undefined && columns > 1 && 'box-list',
            isRTL() && 'rtl'
          )}
          style={{ width }}
          key="list"
          focus={show()}
          data-id={dropdownId}
          fixed="min"
        >
          {data.map((d, index) => {
            const childPosition = positionMap[position as keyof typeof positionMap]
            const itemClassName = dropdownClass(
              'item',
              !width && 'no-width',
              childPosition.indexOf('left') === 0 && 'item-left'
            )

            let renderPlaceholder

            if (renderItem) {
              renderPlaceholder = isFunc(renderItem) ? renderItem(d) : (d as any)[renderItem]
            } else {
              renderPlaceholder = (d as DropdownNode).content
            }
            const { children } = d as DropdownNode
            return children ? (
              <Dropdown
                style={{ width: '100%' }}
                data={children}
                disabled={!!(d as DropdownNode).disabled}
                placeholder={renderPlaceholder}
                type="link"
                key={index}
                position={childPosition as DropdownProps['position']}
                onClick={onClick}
                renderItem={renderItem}
                trigger={getTrigger()}
                isSub
              />
            ) : (
              <Item
                data={d}
                key={index}
                onClick={(d as DropdownNode).onClick || onClick}
                itemClassName={itemClassName}
                renderItem={renderItem}
                columns={columns}
                width={width}
              />
            )
          })}
        </DropdownList>
        {renderButton(placeholder)}
      </>
    );
  };

  // const bindList = () => {
  //   const { animation } = props
  //   const FadeList = List('fade', animation ? 'fast' : 0)
  //   // @ts-ignore
  //   DropdownList = absoluteList(({ focus, ...other }) => <FadeList show={focus} {...other} />)
  // };

  useEffect(() => {
    // bindList();
    setOpenEvent();
  }, []);

  useEffect(() => {
    setOpenEvent();
    return () => {
      toggleDocumentEvent(false);
    };
  }, [props, state]);

  const { data, className, style, placeholder } = props;
  const position = getPosition();

  let wrapClassName = dropdownClass('_', position, show() && 'show', {
    'split-dropdown': !placeholder,
    rtl: isRTL(),
  });
  if (className) wrapClassName += ` ${className}`;

  return (
    <div
      ref={elementRef}
      className={wrapClassName}
      style={style}
      onMouseEnter={() => handleToggle(true)}
      onMouseLeave={() => handleToggle(false)}
      {...getDataset(props)}
    >
      {renderList(data, placeholder, position)}
    </div>
  );

};

Dropdown.defaultProps = DefaultProps as any;
Dropdown.displayName = 'myuiDropdown';

const exports = absoluteComsumer(Dropdown);

export default (exports as unknown) as DropdownType;