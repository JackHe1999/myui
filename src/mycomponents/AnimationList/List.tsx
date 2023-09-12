import React from 'react'
import classnames from 'classnames'
import { listClass } from './styles'
import { ListProps } from './Props'

const List: React.FC<ListProps> = (props) => {
  const className = classnames(listClass('_'), props.className)
  const { show, getRef, ...otherProps } = props;

  return <div ref={getRef} {...otherProps} className={className} style={props.style} />
};

List.displayName = 'List';
List.defaultProps = {
  show: false,
};

export default List;