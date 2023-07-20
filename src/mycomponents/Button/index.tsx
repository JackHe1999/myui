import React, { ReactNode, isValidElement } from "react";
import { wrapSpan } from "../utils/dom/element";

const DefaultProps = {
  size: 'default',
  htmlType: 'button' as 'button',
  outline: false,
  type: 'default',
};

const Button = (props) => {
  const getChildren = (props) => {
    const { children, loading, space } = props;
    if (!children) return children
    const parsed = React.Children.map(wrapSpan(children, space), item => {
      if (loading && isValidElement(item) && (item.type as any).isShineoutIcon) return null
      return item
    })
    return (parsed || []).filter((v: ReactNode) => v !== null)
  };
};

export default Button;