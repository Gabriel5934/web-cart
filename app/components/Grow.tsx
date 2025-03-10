import { Grow } from "@mui/material";

interface Props extends React.PropsWithChildren {
  grow: boolean;
  index: number;
}

export default function GrowWrapper(props: Props) {
  if (props.grow) {
    return (
      <Grow
        in={true}
        timeout={1000}
        style={{ transitionDelay: `${props.index * 100}ms` }}
      >
        <div>{props.children}</div>
      </Grow>
    );
  } else {
    return <>{props.children}</>;
  }
}
