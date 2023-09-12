import classnames from "classnames";
import { ButtonGroupProps } from "./Props";
import { buttonClass } from "./styles";
import React, { Children, cloneElement } from "react";

const ButtonGroup: React.FC<ButtonGroupProps> = (props) => {

  const { children, outline, size, type, style } = props;

  const typeSetted = type !== 'default';
  const className = classnames(
    buttonClass('group', (outline || !typeSetted) && 'outline'),
    props.className
  );

  return (
    <div className={className} style={style}>
      {Children.toArray(children).map((child: any) =>
        cloneElement(child, { size, outline, type: typeSetted ? type : child.props.type })
      )}
    </div>
  );
};

ButtonGroup.defaultProps = {
  outline: false,
  type: 'default'
};

export default ButtonGroup;