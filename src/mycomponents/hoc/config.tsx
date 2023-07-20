import React, { useCallback, useEffect, useState } from "react"
import { noti } from "../config";

export default <U extends any>(Com: React.ComponentType<U>, name: string) => {
  const ComponentWithNotification: React.FC<U> = (props: U) => {
    const [_, setForceUpdate] = useState(false);

    const handleUpdate = useCallback(() => {
      setForceUpdate((prev) => !prev);
    }, []);

    useEffect(() => {
      noti.subscribe(name, handleUpdate);
      return () => {
        noti.unsubscribe(name, handleUpdate);
      }
    }, []);

    return (
      <Com { ...props as any } />
    );
  }
  return ComponentWithNotification;
}

// export default <U extends any>(Com: React.ComponentType<U>, name: string) =>
//   class extends React.Component<U, any> {
//     handleUpdate: () => void

//     constructor(props: U) {
//       super(props)
//       this.handleUpdate = this.forceUpdate.bind(this)
//       noti.subscribe(name, this.handleUpdate)
//     }

//     componentWillUnmount() {
//       noti.unsubscribe(name, this.handleUpdate)
//     }

//     render() {
//       return <Com {...this.props} />
//     }
//   }