import './Aurora.css';

function Aurora({ colorStops = ['#5227FF', '#7cff67', '#5227FF'], amplitude = 1, blend = 0.5 }) {
  const gradient = `radial-gradient(circle at 20% 25%, ${colorStops[0]} 0%, transparent 55%),
    radial-gradient(circle at 78% 18%, ${colorStops[1]} 0%, transparent 60%),
    radial-gradient(circle at 55% 78%, ${colorStops[2]} 0%, transparent 58%)`;

  return (
    <div
      className="aurora"
      style={{
        '--aurora-gradient': gradient,
        '--aurora-amplitude': amplitude,
        '--aurora-blend': blend,
      }}
    />
  );
}

export default Aurora;
