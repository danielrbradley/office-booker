import styled from 'styled-components';

export default styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #f5f5f5;

  padding: 1.6rem 3rem;
  margin-bottom: 2rem;

  border-bottom: 0.2rem solid #efefef;

  > h2 {
    flex: 0 0 auto;

    color: ${(props) => props.theme.palette.primary.main};
    font-size: 2.4rem;
    font-weight: 400;

    margin: 0;
    padding-right: 3rem;
  }

  > .btns {
    flex: 0 0 auto;

    > a {
      font-family: ${(props) => props.theme.typography.fontFamily};
      font-size: 1.2rem;
      font-weight: 500;
      text-decoration: none;

      &:not(:first-of-type) {
        margin-left: 3rem;
      }

      &:not(.current) {
        color: ${(props) => props.theme.palette.text.primary};
      }

      &.current {
        color: ${(props) => props.theme.palette.secondary.main};
        font-weight: 700;
      }
    }
  }
`;
