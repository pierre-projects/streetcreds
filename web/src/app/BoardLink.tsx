// On a wide screen the phone layout leaves the sides of the window empty. This link sits in that
// space and leads to the big-screen board. It is hidden on phones (see .board-link in index.css).
import { Link } from 'react-router'
import { MapIcon } from './icons'
import { strings } from './strings'

export function BoardLink() {
  return (
    <Link to="/board" className="board-link">
      <MapIcon />
      {strings.board.open}
    </Link>
  )
}
