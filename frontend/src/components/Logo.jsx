import { CheckIcon } from './Icons';

export default function Logo({ light = false }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark">
        <CheckIcon size={18} />
      </span>
      <span className="brand-name">Taskflow</span>
    </div>
  );
}
