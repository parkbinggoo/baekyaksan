# 백약산 효과음 지도 · v1.2.6-ui.5

| 상황 | 트리거 | 효과 | 소스 위치 |
|---|---|---|---|
| 모닥불 점화 | 6개 나뭇가지 투입 완료 | 점화 소리 | `gameplay/09-campfire-cooking.js` → `audio/44a-world-events-sound.js::playFireLight()` |
| 모닥불 근처 | 불이 켜져 있고 17m 이내 | 간헐적 타닥거림·거리별 감소 | `audio/44a-world-events-sound.js::updateWorldSounds()` |
| 조리 동작 | 조리 0~7단계 변경 | 팬·재료·소금·볶기·먹기 효과 | `gameplay/09-campfire-cooking.js::tickCampCooking()` |
| 텐트 출입 | 실제 입장/퇴장 전환 | 지퍼 소리 | `gameplay/11-tent-occupancy.js::changeTent()` |
| 멧돼지 경고 | 경고 OFF→ON | 2초 안팎 긴장 저음 | `world/47-wildlife-states.js::updateBoarWarning()` |
| 동굴 입장/퇴장 | 동굴 화면 전환 | 원음 페이드 + 동굴 신성한 저음 화음/공명 | `world/53-secret-cave-world.js` + `audio/44a-world-events-sound.js` |
| 천둥번개 날씨 | 모두에게 동일한 날씨 시드와 시간 | 폭우·빠른 번개 광원·시차 있는 천둥 | `world/42-weather.js::updateThunderstorm()` |
| 눈이 쌓인 지형 | 실제 눈 덮임 조건과 캐릭터의 이동 거리 | 눈 눌리는 소리 | `audio/44a-world-events-sound.js::updateWorldSounds()` |
| 산삼 채집 | 채집 성공, 황금 산삼 포함 | 두 바퀴 회전, 축하음, 음성(선택), 전원 알림 | `gameplay/32-harvest.js`, `graphics/20-hiker-avatar.js`, `network/38-multiplayer.js` |

모든 합성음은 기존 `audio/04-audio-core.js`의 `audioOutput` 경유로 출력합니다. 실제 녹음된 음원·저작권 곡은 사용하지 않습니다. 공용 MQTT 특성상 알림은 실시간 접속자에게만 전송되며 전달 보장/재전송은 구현하지 않았습니다.
