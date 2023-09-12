import React, { isValidElement, cloneElement } from 'react'
import { defaultProps } from '../utils/defaultProps'
import { DropdownNode, ItemProps } from './Props'

const DefaultProps = {
  ...defaultProps,
  data: {},
  renderItem: 'content',
}

interface ItemLinkProps {
  href?: string
  target?: string
  className?: string
  disabled?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

const Item = (props: ItemProps) => {
  
  const handleClick = () => {
    if (!props.onClick) return;
    props.onClick(props.data);
  };

  const { data, itemClassName, renderItem, width, columns } = props;
  const aWidth = width && columns ? (width - 2) / columns : undefined
  const newProps: ItemLinkProps = {
    disabled: (data as DropdownNode).disabled,
    onClick: handleClick,
    className: itemClassName,
    target: (data as DropdownNode).target,
    style: (aWidth ? { display: 'inline-block', width: aWidth } : null) as React.CSSProperties,
  };
  if ((data as DropdownNode).url) newProps.href = (data as DropdownNode).url

  let content
  if (isValidElement(data)) {
    content = data
  } else {
    // @ts-ignore
    content = typeof renderItem === 'string' ? data[renderItem as keyof typeof data] : renderItem(data)
  }

  if (isValidElement(content)) {
    return cloneElement(content, Object.assign(newProps, content.props))
  }
  return <a {...newProps}>{content}</a>
};

Item.defaultProps = DefaultProps;

export default Item;