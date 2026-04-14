import { router } from "expo-router";
import { IconButton } from "@/components/IconButton";
import { useAudioStore } from "@/store/audioStore";
import { colors } from "@/theme/colors";

export function NowPlayingButton() {
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const hasSession = useAudioStore((s) => !!s.chapterId);

  return (
    <IconButton
      name="music"
      accessibilityLabel="Open player"
      onPress={() => router.push("/player")}
      color={hasSession ? (isPlaying ? colors.primary : colors.text) : colors.muted}
    />
  );
}

