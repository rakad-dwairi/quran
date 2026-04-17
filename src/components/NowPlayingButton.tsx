import { router } from "expo-router";
import { IconButton } from "@/components/IconButton";
import { useAppLocale } from "@/i18n/useAppLocale";
import { useAudioStore } from "@/store/audioStore";
import { colors } from "@/theme/colors";

export function NowPlayingButton() {
  const { t } = useAppLocale();
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const hasSession = useAudioStore((s) => !!s.chapterId);

  return (
    <IconButton
      name="music"
      accessibilityLabel={t("common.openPlayer")}
      onPress={() => router.push("/player")}
      color={hasSession ? (isPlaying ? colors.primary : colors.text) : colors.muted}
    />
  );
}
