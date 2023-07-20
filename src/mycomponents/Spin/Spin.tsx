import React from "react";
import { OriginSpinProps } from "./Props";
import classNames from "classnames";
import { range } from "../utils/numbers";

const Spin = (props: OriginSpinProps) => {
  const { spinClass, count = 0, render, size, wrapperClass, wrapperStyle } = props;

  const style = Object.assign(
    {
      width: size,
      height: size
    },
    props.style,
    wrapperClass
  )

  const className = classNames(spinClass('_'), wrapperClass);

  if(count < 1 || !render){
    return <div style={style} className={className}/>
  }

  return (
    <div style={style} className={className}>
      {range(count + 1, 1).map(i => render(spinClass, i, props))}
    </div>
  )
};

export default Spin;