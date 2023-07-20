import React from "react";
import Spin from "./Spin";
import { OriginSpinProps, TypeSpinProps } from "./Props";
import { chasingDotsClass, chasingRingClass, cubeGridClass, defaultClass, doubleBounceClass, fourDotsClass, scaleCircleClass, threeBounceClass, waveClass } from "./styles";
import { formatSize } from "./util";

function simpleRender(classname: OriginSpinProps['spinClass'], i: number, { color, itemStyle }: OriginSpinProps) {
  const style = Object.assign({ backgroundColor: color }, itemStyle);
  return <div key={i} style={style} className={classname('item')} />
}

export function DoubleBounce(props: TypeSpinProps) {
  return <Spin {...props} count={2} spinClass={doubleBounceClass} render={simpleRender} />
}

export function Wave(props: TypeSpinProps) {
  const { value, unit } = formatSize(props.size);
  let width = value / 7;
  let margin: string | number = value / 20;

  if (unit === 'px') {
    width = Math.floor(width);
    margin = Math.ceil(margin) + unit;
  } else {
    margin = '2px';
  }

  return (
    <Spin
      {...props}
      itemStyle={{ width: width + unit, marginRight: margin }}
      count={5}
      spinClass={waveClass}
      render={simpleRender}
    />
  )
}

export function CubeGrid(props: TypeSpinProps) {
  return <Spin {...props} count={9} spinClass={cubeGridClass} render={simpleRender} />
}

export function ChasingRing(prop: TypeSpinProps) {
  const { value, unit } = formatSize(prop.size)
  const borderWidth = `${value / 10}${unit}`
  const style = { borderWidth, borderTopColor: prop.color, backgroundColor: 'transparent' }
  return <Spin {...prop} count={4} itemStyle={style} spinClass={chasingRingClass} render={simpleRender} />
}

// =========================================================

function multRenderDiv(
  className: OriginSpinProps['spinClass'],
  i: number,
  { color, itemStyle, itemClass }: OriginSpinProps
){
  const style = Object.assign({ backgroundColor: color }, itemStyle);
  return (
    <div key={i} className={className('item', itemClass)}>
      <div style={style} />
    </div>
  )
}

export function Default(props: TypeSpinProps){
  const { value, unit } = formatSize(props.size);
  const size = Math.ceil(value / 12.5) + unit;
  return (
    <Spin
      {...props}
      count={12}
      itemStyle={{ width: size, borderRadius: size }}
      spinClass={defaultClass}
      render={multRenderDiv}
    />
  )
}

// ====================================================

function multRenderSvg(
  className: OriginSpinProps['spinClass'],
  i: number,
  { color, itemSize, itemClass }: OriginSpinProps
){
  return (
    <div key={i} className={className('item', itemClass)}>
      <svg width={itemSize} height={itemSize} viewBox="0 0 100 100">
        <circle fill={color} cx={50} cy={50} r={50} />
      </svg>
    </div>
  )
}

function twelveCircle(props: TypeSpinProps, type: OriginSpinProps['itemClass']){
  const { value, unit } = formatSize(props.size);
  const itemSize = (value / 7).toFixed(3) + unit;

  return (
    <Spin
      {...props}
      count={12}
      itemSize={itemSize}
      itemClass={type}
      spinClass={scaleCircleClass}
      render={multRenderSvg}
    />
  )
}

export const ScaleCircle = (opt: TypeSpinProps) => twelveCircle(opt, 'scale');
export const FadingCircle = (opt: TypeSpinProps) => twelveCircle(opt, 'fade');

export function ThreeBounce(props: TypeSpinProps){
  const { value, unit } = formatSize(props.size);
  return (
    <Spin
      {...props}
      count={3}
      style={{ width: value * 2 + unit, height: 'auto' }}
      itemSize={value / 2 + unit}
      spinClass={threeBounceClass}
      render={multRenderSvg}
    />
  )
}

export function ChasingDots(props: TypeSpinProps){
  return <Spin {...props} count={2} spinClass={chasingDotsClass} render={multRenderSvg} />
}

export function FourDots(props: TypeSpinProps) {
  return <Spin {...props} count={4} spinClass={fourDotsClass} render={multRenderSvg} />
}