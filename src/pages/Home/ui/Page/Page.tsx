import {FC} from 'react';
import {runKernel} from '@/kernel.tsx';

const Home: FC = () => {
  return (
    <>
      <section>
        <div className="hero min-h-[calc(100vh-64px)] bg-base-200">
          <div className="hero-content flex-col lg:flex-row">
            <img src="/images/hero.webp" className="max-w-sm rounded-lg shadow-2xl" />
            <div>
              <h1 className="text-5xl font-bold">Welcome</h1>

              <button
                className="btn-primary btn"
                onClick={() => {
                  runKernel();
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
