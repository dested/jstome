import {FC} from 'react';
import {Outlet} from 'react-router-dom';

export const Layout: FC = () => {
  return (
    <div className="h-screen overflow-x-hidden">
      <main>
        <Outlet />
      </main>
    </div>
  );
};
