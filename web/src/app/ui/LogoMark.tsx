// StreetCreds brand mark from the logo pack: white geometric S on orange (#ff6700 family).
const MARK_SRC = '/brand/mark.png'

type LogoMarkProps = {
  className?: string
}

export function LogoMark({ className = 'size-7' }: LogoMarkProps) {
  return (
    <img
      src={MARK_SRC}
      alt=""
      aria-hidden="true"
      width={28}
      height={28}
      draggable={false}
      className={`shrink-0 rounded-[6px] object-cover ${className}`}
    />
  )
}
