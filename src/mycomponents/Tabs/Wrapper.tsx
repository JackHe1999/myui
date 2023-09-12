import React from 'react'
import Panel from './Panel'
import { Provider } from '../Sticky/context'
import { WrapperProps } from './Props'

const Wrapper = (props: WrapperProps) => {
  const { active, id, ...other } = props;
  return (
    <Provider value={{ needResetPostion: id === active }}>
      <Panel {...other} isActive={id === active} />
    </Provider>
  )
};

export default Wrapper;