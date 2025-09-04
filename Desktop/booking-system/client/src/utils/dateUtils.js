import moment from 'moment'

export const formatDate = (dateString) => {
  return moment(dateString).format('ddd, MMM D')
}

export const formatTime = (dateString) => {
  return moment(dateString).format('h:mm A')
}

export const formatDateTime = (dateString) => {
  return moment(dateString).format('ddd, MMM D [at] h:mm A')
}

export const formatFullDate = (dateString) => {
  return moment(dateString).format('dddd, MMMM Do YYYY')
}

export const isToday = (dateString) => {
  return moment(dateString).isSame(moment(), 'day')
}

export const isTomorrow = (dateString) => {
  return moment(dateString).isSame(moment().add(1, 'day'), 'day')
}

export const getRelativeDate = (dateString) => {
  if (isToday(dateString)) return 'Today'
  if (isTomorrow(dateString)) return 'Tomorrow'
  return formatDate(dateString)
}

export const getTodayDate = () => {
  return moment().format('YYYY-MM-DD')
}

export const getWeekFromNow = () => {
  return moment().add(7, 'days').format('YYYY-MM-DD')
}

export const getWeekAgo = () => {
  return moment().subtract(7, 'days').format('YYYY-MM-DD')
}