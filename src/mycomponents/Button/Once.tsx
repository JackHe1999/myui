import { useState } from "react";
import { ButtonProps } from "./Props";
import Button from "./Button";

interface OnceButtonProps extends ButtonProps{
  loading?: boolean
}

const OnceButton: React.FC<OnceButtonProps> = (props) => {
  const [loading, setLoading] = useState(props.loading);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const { onClick } = props;
    setLoading(true);
    if (onClick) onClick(e);
  };

  return (
    <Button {...props} loading={loading} onClick={handleClick} />
  );
};

export default OnceButton;