import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import Modal, { ModalHeader } from "./Modal";
import Icon from "./icons";

const MEMBERS = [
  { img: "/Aadi.png", alt: "Aaditya Sardar", nameKey: "aadiName", roleKey: "teamLeader", github: "https://github.com/Aaditya288" },
  { img: "/Teesta.jpeg", alt: "Teesta Mukherjee", nameKey: "teestaName", roleKey: "fullStackRole", github: "https://github.com/Teesta-Mukherjee" },
  { img: "/akash.jpeg", alt: "Akash Datta", nameKey: "akashName", roleKey: "frontendRole", github: "https://github.com/AkashDatta" },
  { img: "/ayush.jpeg", alt: "Ayush Mondal", nameKey: "ayushName", roleKey: "designRole", github: "https://github.com/A-y-u-s-h-9" },
  { img: "/anuvab.jpeg", alt: "Anuvab Kundu", nameKey: "anuvabName", roleKey: "mlArchitectExec", github: "https://github.com/anuvab12370" },
  { img: "/jishnu.jpeg", alt: "Jishnu Pal", nameKey: "jishnuName", roleKey: "mlArchitectDesign", github: "https://github.com/patrikLM10" },
];

export default function AboutAuthors({ onClose }) {
  const { t } = useLanguage();
  const [zoomedMember, setZoomedMember] = useState(null);
  const [mobileZoomed, setMobileZoomed] = useState(null);

  const handleAvatarClick = (member) => {
    if (window.innerWidth > 700) {
      setZoomedMember(member.nameKey);
    } else {
      setMobileZoomed(member);
    }
  };

  return (
    <>
      <Modal label={t("aboutTitle")} onClose={onClose} wide>
        <ModalHeader icon="waves" title={t("aboutTitle")} onClose={onClose} closeLabel={t("close")} />
        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="mb-3 rounded-lg border border-ink/10 bg-ink/[0.03] p-4 text-center
            dark:border-paper/20 dark:bg-paper/[0.04]">
            <span className="text-[10px] font-bold text-accent dark:text-paper">{t("presentedBy")}</span>
            <h4 className="m-0 mt-1 font-display text-lg font-bold text-ink dark:text-paper">{t("teamName")}</h4>
            <p className="m-0 mt-1 text-[12px] text-ink/60 dark:text-paper/60">{t("teamSubtitle")}</p>
          </div>

          <div className="my-3 flex items-center gap-2 text-[11px] font-bold text-ink/45 dark:text-ink/60">
            <span className="h-px flex-1 bg-slate-200 dark:bg-paper/10" />
            <span>{t("contributors")}</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-paper/10" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MEMBERS.map((m) => (
              <div
                key={m.nameKey}
                className="relative rounded-lg border border-ink/10 bg-paper p-3 text-center dark:border-paper/10 dark:bg-paper/[0.05]"
                style={{ zIndex: zoomedMember === m.nameKey ? 20 : 1 }}
              >
                {zoomedMember === m.nameKey && (
                  <div
                    onClick={(e) => { e.stopPropagation(); setZoomedMember(null); }}
                    className="absolute -inset-2 z-[100] flex cursor-pointer flex-col items-center justify-center rounded-lg bg-paper/95 p-3 shadow-lift backdrop-blur
                      dark:bg-ink/95"
                  >
                    <img src={m.img} alt={t(m.nameKey)} className="mb-3 h-[120px] w-[120px] rounded-full border-[3px] border-ink/15 object-cover dark:border-paper/25" />
                    <h5 className="m-0 mb-1 text-center font-display text-[15px] font-bold text-ink dark:text-paper">{t(m.nameKey)}</h5>
                    <span className="flex items-center gap-1 text-[11px] text-ink/60 dark:text-paper/60">
                      <Icon name="close" size={10} /> {t("close")}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleAvatarClick(m)}
                  aria-label={`${t(m.nameKey)} — ${t("close")}`}
                  className="oe-focus-visible mx-auto block h-16 w-16 cursor-pointer overflow-hidden rounded-full border-2 border-ink/10 transition-transform hover:scale-105
                    dark:border-paper/20 sm:h-20 sm:w-20"
                >
                  <img src={m.img} alt={m.alt} className="h-full w-full object-cover" />
                </button>
                <h5 className="m-0 mt-2 text-[13px] font-bold text-ink dark:text-paper">{t(m.nameKey)}</h5>
                <p className="m-0 mt-0.5 text-[11px] font-semibold text-ink/60 dark:text-paper/60">{t(m.roleKey)}</p>
                <a
                  href={m.github}
                  target="_blank"
                  rel="noreferrer"
                  className="oe-focus-visible mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline dark:text-paper"
                >
                  <Icon name="arrowRight" size={11} />
                  {t("githubProfile")}
                </a>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {mobileZoomed && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm" onClick={() => setMobileZoomed(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t(mobileZoomed.nameKey)}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-lg bg-paper shadow-lift dark:bg-ink"
          >
            <button
              type="button"
              onClick={() => setMobileZoomed(null)}
              className="oe-focus-visible m-3 inline-flex items-center gap-1 rounded-lg border border-ink/10 px-3 py-1.5 text-[12px] font-bold text-ink/80 dark:border-paper/15 dark:text-slate-200"
            >
              ← {t("close")}
            </button>
            <img src={mobileZoomed.img} alt={t(mobileZoomed.nameKey)} className="max-h-[60vh] w-full object-cover" />
            <div className="p-3 text-center text-[15px] font-bold text-ink dark:text-paper">
              {t(mobileZoomed.nameKey)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
