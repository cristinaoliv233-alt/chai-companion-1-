/**
 * A Chai: uma esfera lilás dentro de uma cápsula de vidro (o futuro dispositivo físico).
 * mood: "idle" flutua e pisca | "thinking" os olhos movem-se | "speaking" a esfera pulsa.
 */
export default function Orb({ mood = "idle", size = "md" }) {
  return (
    <div className={`orb-wrap orb-${size} mood-${mood}`} aria-hidden="true">
      <div className="capsule">
        <div className="orb-float">
          <div className="orb">
            <div className="eyes">
              <span className="eye" />
              <span className="eye" />
            </div>
          </div>
        </div>
      </div>
      <div className="capsule-base" />
    </div>
  );
}
