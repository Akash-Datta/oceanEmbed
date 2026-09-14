import React from "react";
import { useLanguage } from "../context/LanguageContext";
import Modal, { ModalHeader } from "./Modal";
import Icon from "./icons";

const STEPS = [
  { icon: "grid", titleKey: "step1Title", descKey: "step1Desc" },
  { icon: "pin", titleKey: "step2Title", descKey: "step2Desc" },
  { icon: "grid", titleKey: "step3Title", descKey: "step3Desc" },
  { icon: "layers", titleKey: "step4Title", descKey: "step4Desc" },
  { icon: "thermometer", titleKey: "step5Title", descKey: "step5Desc" },
];

export default function WebGuidelines({ onClose }) {
  const { t } = useLanguage();

  return (
    <Modal label={t("guidelinesTitle")} onClose={onClose} wide>
      <ModalHeader icon="compass" title={t("guidelinesTitle")} onClose={onClose} closeLabel={t("close")} />
      <div className="overflow-y-auto p-4 sm:p-5">
        <div className="mb-3 rounded-lg border border-ink/10 bg-ink/[0.03] p-4 text-center
          dark:border-paper/20 dark:bg-paper/[0.04]">
          <span className="text-[10px] font-bold text-accent dark:text-paper">{t("platformOverview")}</span>
          <h4 className="m-0 mt-1 font-display text-lg font-bold text-ink dark:text-paper">{t("navigationGuide")}</h4>
          <p className="m-0 mt-1 text-[12px] text-ink/60 dark:text-paper/60">{t("guidelinesSubtitle")}</p>
        </div>

        <div className="my-3 flex items-center gap-2 text-[11px] font-bold text-ink/45 dark:text-ink/60">
          <span className="h-px flex-1 bg-slate-200 dark:bg-paper/10" />
          <span>{t("stepInstructions")}</span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-paper/10" />
        </div>

        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {STEPS.map((s, i) => (
            <li
              key={s.titleKey}
              className="flex items-start gap-3 rounded-lg border border-ink/10 bg-paper p-3
                dark:border-paper/10 dark:bg-paper/[0.05]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-[13px] text-accent
                dark:bg-accent/15 dark:text-paper">
                {i + 1}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05] text-accent
                dark:bg-paper/10 dark:text-paper">
                <Icon name={s.icon} size={15} />
              </span>
              <div className="min-w-0">
                <h5 className="m-0 font-display text-[14px] font-bold text-ink dark:text-paper">{t(s.titleKey)}</h5>
                <p className="m-0 mt-0.5 text-[12px] leading-relaxed text-ink/60 dark:text-paper/60">{t(s.descKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Modal>
  );
}
