import React, { ReactNode, isValidElement } from "react";
import { wrapSpan } from "../utils/dom/element";
import { ButtonProps } from "./Props";
import classnames from "classnames";
import { buttonClass } from "./styles";
import Spin from "../Spin";
import Group from './Group';
import Once from './Once';

const DefaultProps = {
  size: 'default',
  htmlType: 'button' as 'button',
  outline: false,
  type: 'default',
};

const Button = (props: ButtonProps) => {
  const {
    outline: outlineProp,
    type: typeProp,
    size,
    href,
    htmlType,
    loading,
    disabled,
    onRef,
    shape,
    text,
    space,
    target,
    ...others
  } = props;
  const isSecondary = typeProp === 'secondary' && !outlineProp && !text
  const type = isSecondary ? 'primary' : typeProp
  const outline = outlineProp || isSecondary
  let color = outline || type === 'default' ? undefined : '#fff'
  if (text) color = 'currentColor'
  const className = classnames(
    buttonClass('_', shape !== 'default' && shape, type, outline && 'outline', {
      large: size === 'large',
      small: size === 'small',
      text: text && 'text',
      disabled,
    }),
    props.className
  );

  if (href && !disabled) {
    return (
      <a href={href} {...others} target={target} className={className} ref={onRef}>
        {props.children}
      </a>
    );
  }

  const getChildren = () => {
    const { children, loading, space } = props;
    if (!children) return children
    const parsed = React.Children.map(wrapSpan(children, space), item => {
      if (loading && isValidElement(item) && (item.type as any).isMyuiIcon) return null;
      return item;
    })
    return (parsed || []).filter((v: ReactNode) => v !== null);
  };

  const children = getChildren();

  return (
    <button {...others} ref={onRef} disabled={disabled || loading} type={htmlType} className={className}>
      {loading && (
        <span className={buttonClass('spin')}>
          <Spin size={12} name="ring" color={color} />
        </span>
      )}
      {children}
    </button>
  );
};

Button.displayName = 'myuiButton';
Button.Group = Group;
Button.Once = Once;
Button.defaultProps = DefaultProps as ButtonProps;

export default Button;