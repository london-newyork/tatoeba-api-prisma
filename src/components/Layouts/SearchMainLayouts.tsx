import React, { VFC } from 'react';
import { Layouts } from '../types/types';

export const SearchMainLayouts:VFC<Layouts> = (props) => {
  return (
    <main
    className="
    md:pt-[100px]
    sm:pt-[80px]
    h-screen
    px-7
    md:px-24
    mx-auto
    pt-9">
    {props.children}
    </main>
  )
};