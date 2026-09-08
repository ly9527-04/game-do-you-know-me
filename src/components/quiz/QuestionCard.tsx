'use client'

import type { AnswerChoice, Question } from '@/types/domain'

export type QuestionCardProps = {
  question: Question
  value: AnswerChoice | undefined
  onSelect: (value: AnswerChoice) => void
  disabled: boolean
}

export function QuestionCard({ question, value, onSelect, disabled }: QuestionCardProps) {
  const headingId = `question-${question.id}`

  return (
    <section className="question-card" aria-labelledby={headingId}>
      <p className="question-card__order">第 {String(question.order).padStart(2, '0')} 题</p>
      <h2 id={headingId}>{question.prompt}</h2>
      <div className="question-card__options" role="group" aria-labelledby={headingId}>
        {question.options.map((option) => {
          const selected = option.value === value

          return (
            <button
              className="question-card__option"
              data-selected={selected}
              key={option.value}
              type="button"
              aria-pressed={selected}
              aria-label={`${option.value}：${option.text}${selected ? '，已选' : ''}`}
              disabled={disabled}
              onClick={() => onSelect(option.value)}
            >
              <span className="question-card__letter" aria-hidden="true">{option.value}</span>
              <span className="question-card__option-text">{option.text}</span>
              {selected ? <span className="question-card__selected"><i className="fa-solid fa-check" aria-hidden="true" /> 已选</span> : <i className="fa-solid fa-chevron-right option-chevron" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
