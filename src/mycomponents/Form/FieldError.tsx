import React from 'react'
import { formClass } from './styles'
import { FieldErrorProps } from './Props'

const FieldError = (props: FieldErrorProps) => {
  let { error } = props;

  if(Array.isArray(error)) error = error[0];

  if(!(error instanceof Error)) return null;

  return <div className={formClass('error')}>{error.message}</div>;
};

export default FieldError;