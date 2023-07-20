import React from "react";
import history from "../../history";
import { homeClass } from "../../styles";
import { Button } from "../../mycomponents";
import Icon from "../../icons/Icon";

const Home = () => {

  const start = () => {
    history.push('/components/GetStart');
  };

  return (
    <div className={homeClass('_')}>
      <div className={homeClass('content')}>
          <h2>MyUI</h2>
          <div>一个更加『轻量』和『快速』的基于React的桌面端组件库</div>
          <div className={homeClass('buttons')}>
            <Button type="primary" onClick={start}>
              开始使用
            </Button>
            <Button style={{ marginLeft: 20 }} href="#">
              <Icon name="github" /> GitHub
            </Button>
          </div>
        </div>
    </div>
  );

};

export default Home;