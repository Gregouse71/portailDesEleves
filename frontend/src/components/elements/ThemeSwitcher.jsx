import React from 'react';
import './../../assets/styles/themeswitcher.scss';

const ThemeSwitcher = ({ theme, toggleTheme }) => {
  return (
    <label className="theme-switcher">
      <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
      <span className="slider">
        <span className="icon sun">
          <img src="/assets/icons/sun.svg" alt="Light mode" />
        </span>
        <span className="icon moon">
          <img src="/assets/icons/moon.svg" alt="Dark mode" />
        </span>
      </span>
    </label>
  );
};

export default ThemeSwitcher;
