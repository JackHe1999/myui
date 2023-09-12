import React, { useEffect, useRef, useState } from 'react'
import { lazyloadClass } from './styles'
import { addStack, removeStack } from '../utils/lazyload'
import { LazyloadProps } from './Props'

interface LazyloadState {
  ready: boolean
}

const DefaultProps = {
  offset: 0,
}

const Lazyload = (props: LazyloadProps) => {
  const { container, offset = DefaultProps.offset, children, placeholder } = props;
  const placeholderRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [lazyId, setLazyId] = useState<string | null>(null);

  useEffect(() => {
    setLazyId(addStack({
      offset,
      container,
      element: placeholderRef.current!,
      render: () => setReady(true),
    }));
    return () => {
      removeStack(lazyId);
    }
  }, []);

  if(ready) return children;
  return (
    <span ref={placeholderRef} className={lazyloadClass('_')}>
      {placeholder}
    </span>
  );
};

Lazyload.defaultProps = DefaultProps;

export default Lazyload;