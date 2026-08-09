import type { CSSProperties } from 'react';

export function IntroLetterStep({ onNext }: { onNext: () => void }) {
  return (
    <main className="intro-letter-page" aria-label="恰好关系俱乐部介绍信">
      <section className="intro-letter-card">
        <span className="intro-letter-salute">见字如面。</span>
        <div className="intro-letter-columns">
          <div className="intro-letter-body">
            <p>
              我是90后的小CC，和此刻正在读这封信的你一样，也想在这个快节奏的城市里，认真寻找并建立一段长期而真实的亲密关系。
            </p>
            <p>
              我相信，所有恰好关系都是从见面开始的。所以我开设了针对不同情感需求场景的线下交友活动，想给你一个机会——认真认识别人，也被认真认识。
            </p>
          </div>
          <div className="intro-letter-photos">
            <img className="intro-letter-photo intro-letter-photo--portrait" src="/assets/intro-portrait.png" alt="小CC" />
            <img className="intro-letter-photo intro-letter-photo--cat" src="/assets/intro-cat.jpg" alt="小猫" />
          </div>
        </div>
        <p className="intro-letter-purpose">
          我做这个小程序，是想先更懂你们<strong>真正的交友需求</strong>，再用
          <strong>恰好的人、恰好的方式</strong>把相遇精准送到你面前，
          <strong>少一点出门的犹豫，多一点线下相遇的可能</strong>——让<strong>可靠的关系</strong>，从
          <strong>一次真实的见面</strong>开始。
        </p>
        <p className="intro-letter-sign">小CC</p>
        <h2>恰好的信奉</h2>
        <div className="intro-letter-tags" aria-label="恰好的信奉">
          <span style={{ '--i': 0 } as CSSProperties}>喜欢要从见面开始</span>
          <span style={{ '--i': 1 } as CSSProperties}>先立体识人，而后心生欢喜</span>
          <span style={{ '--i': 2 } as CSSProperties}>接住不同情感需求场景</span>
        </div>
        <button type="button" className="intro-letter-button" onClick={onNext}>
          开始吧 →
        </button>
      </section>
    </main>
  );
}
