import React from 'react';
import { Link } from 'react-router-dom'
import { headerClass } from './styles'
import logo from './icons/logo'
import FontAwesome from './pages/components/Icon/FontAwesome';
import { NavLink } from 'react-router-dom'

const Header = () => {

  const path = ''

  const navs = [
    { path: '/', en: 'Home', cn: '首页' },
    { path: '/components/GetStart', en: 'Components', cn: '组件' },
  ]

  return (
    <div className={headerClass('_')}>
      <div className={headerClass('logo')}>
        <Link to="/">{logo}</Link>
      </div>
      <div className={headerClass('nav')}>
        {navs.map(nav => (
          <NavLink key={nav.path} to={nav.path} className={headerClass(path === nav.path && 'active')}>
            {nav.cn}
          </NavLink>
        ))}
      </div>
      <div className={headerClass('docsearch')}>
        <label htmlFor="algolia-doc-search">
          <FontAwesome name="search" className={headerClass('icon')} />
        </label>
        <input
          placeholder='在 myui 中搜索'
          className={headerClass('search')}
          id="algolia-doc-search"
          width={220}
        />
      </div>
      
    </div>
  );
};

export default Header;