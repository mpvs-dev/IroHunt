import { memo, useState } from "react";
import { AVATARES } from "../constants/avatares";

function AvatarVisual({ avatarId, size = 24, color = "#fff" }) {
  const avatar = AVATARES.find((a) => a.id === avatarId);
  const [imgError, setImgError] = useState(false);

  if (!avatar) return null;

  if (avatar.url && !imgError) {
    return (
      <img
        className="avatar-visual__imagen"
        src={avatar.url}
        alt={avatarId}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  const Icon = avatar.Icon;
  return <Icon size={size} color={color} strokeWidth={1.75} />;
}

export default memo(AvatarVisual);
