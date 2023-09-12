import React from 'react'
import classnames from 'classnames'
import { tabsClass } from './styles'
import { isLink } from '../utils/is'
import { TabsLinkProps } from './Props'

const Link = (props: TabsLinkProps) => {
  const { children, href, className, ...other } = props;
  const mergeClass = classnames(className, tabsClass('link'))

  const newProps = {
    className: mergeClass,
    href,
    ...other,
  }

  if (isLink(children)) {
    if (children.props.onClick) {
      newProps.onClick = () => {
        children.props.onClick()
        if (other.onClick) {
          other.onClick()
        }
      }
    }
    return React.cloneElement(children, { ...newProps })
  }

  return <a {...newProps}>{children}</a>
};

Link.isTabLink = true;

export default Link;