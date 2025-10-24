import type { JSX } from 'react';

export const MobilePlaceholderComponent = (): JSX.Element => {
  return (
    <div className="px-5 pt-10 text-base">
      <img
        src="/images/embarrassed-bull.png"
        alt="Mobile placeholder"
        className="mx-auto h-[200px] w-[200px]"
      />
      <br />
      <br />
      My friend, I don&apos;t know how to fit logs search into small mobile screen
      <br />
      <br />
      Seriously, it&apos;s not a good idea to use mobile devices for this kind of work... Use your
      laptop or desktop computer, please
      <br />
      <br />
      Anyway, I will try to implement mobile version, but after I complete dark theme (we all need
      it). Dark theme is more important for UX than trying to put hundreds of lines of logs here
      <br />
      <br />
      By the way,
      <a
        href="https://t.me/logbull_community"
        target="_blank"
        rel="noopener noreferrer"
        className="!text-emerald-600 underline decoration-emerald-600 underline-offset-2 transition-colors hover:text-emerald-700"
      >
        &nbsp;we have community&nbsp;
      </a>
      and project really require your star on{' '}
      <a
        href="https://github.com/logbull/logbull"
        target="_blank"
        rel="noopener noreferrer"
        className="!text-emerald-600 underline decoration-emerald-600 underline-offset-2 transition-colors hover:text-emerald-700"
      >
        GitHub
      </a>
      . Each star matters a lot
    </div>
  );
};
