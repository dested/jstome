import {FC} from 'react';
import {Route, Routes} from 'react-router-dom';
import {Layout} from './Layout';
import {Home} from '@/pages/Home/home.tsx';
import {NoMatch} from '@/pages/NoMatch';
import Other from '@/pages/Home/other.tsx';

const App: FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="other" element={<Other />} />
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
